import * as vscode from "vscode";
import type { Fix, LintError, LintResult } from "markdownlint-obsidian/api";
import { readExtensionSettings } from "./config/settings.js";
import { CoreLibraryAdapter } from "./core/coreLibraryAdapter.js";
import { detectFlavorGrenade } from "./dependencies/flavorGrenade.js";
import { lintErrorToDiagnosticData } from "./diagnostics/diagnosticData.js";
import { decideEligibility } from "./diagnostics/eligibility.js";
import { fixToTextEdit } from "./fixes/fixEdits.js";
import { ruleDocumentationUrl } from "./fixes/ruleDocs.js";
import { COMMANDS, CONFIG_SECTION, SUPPORTED_CONFIG_FILES } from "./shared/constants.js";
import type {
  DependencyState,
  DiagnosticData,
  DocumentSnapshot,
  ExtensionSettings,
} from "./shared/types.js";

const engine = new CoreLibraryAdapter();

interface StoredResult {
  readonly documentVersion: number;
  readonly result: LintResult;
}

class ExtensionRuntime {
  private readonly output = vscode.window.createOutputChannel("markdownlint Obsidian");
  private readonly diagnostics =
    vscode.languages.createDiagnosticCollection("markdownlint-obsidian");
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly results = new Map<string, StoredResult>();
  private liveEnabled = true;

  constructor(private readonly context: vscode.ExtensionContext) {}

  activate(): void {
    this.context.subscriptions.push(this.output, this.diagnostics);
    this.context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => void this.lint(doc)),
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((doc) => this.clear(doc.uri)),
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => void this.onSave(doc)),
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((e) => this.onChange(e.document)),
    );
    this.context.subscriptions.push(
      vscode.window.onDidChangeVisibleTextEditors(() => void this.lintVisible()),
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_SECTION)) void this.lintVisible();
      }),
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => void this.lintVisible()),
    );
    this.registerCommands();
    this.registerCodeActions();
    void this.lintVisible();
  }

  private registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.lintWorkspace, () => this.lintWorkspace()),
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.openConfig, () => this.openConfig()),
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.disable, () => this.disable()),
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.enable, () => this.enable()),
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.fixAll, () => this.fixAll()),
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.previewFixes, () => this.previewFixes()),
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.openRuleHelp, (code: string) =>
        this.openRuleHelp(code),
      ),
    );
  }

  private registerCodeActions(): void {
    this.context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        { language: "ofmarkdown", scheme: "file" },
        {
          provideCodeActions: (doc, _range, context) => this.codeActions(doc, context.diagnostics),
        },
        {
          providedCodeActionKinds: [
            vscode.CodeActionKind.QuickFix,
            vscode.CodeActionKind.SourceFixAll,
          ],
        },
      ),
    );
  }

  private onChange(document: vscode.TextDocument): void {
    const settings = this.settings(document.uri);
    if (settings.runMode !== "onType") return;
    const key = document.uri.toString();
    const oldTimer = this.timers.get(key);
    if (oldTimer !== undefined) clearTimeout(oldTimer);
    this.timers.set(
      key,
      setTimeout(() => void this.lint(document), settings.debounceMs),
    );
  }

  private async onSave(document: vscode.TextDocument): Promise<void> {
    if (this.settings(document.uri).runMode === "onSave") await this.lint(document);
  }

  private async lintVisible(): Promise<void> {
    await Promise.all(vscode.window.visibleTextEditors.map((editor) => this.lint(editor.document)));
  }

  private async lint(document: vscode.TextDocument): Promise<void> {
    const decision = decideEligibility(
      this.snapshot(document),
      this.settings(document.uri),
      this.session(),
      this.dependency(),
    );
    if (!decision.eligible) {
      this.clear(document.uri);
      return;
    }
    const root = this.workspaceRoot(document.uri);
    if (root === null)
      return this.output.appendLine(`No workspace folder for ${document.uri.toString()}`);
    const version = document.version;
    try {
      const result = await engine.lintDocument({
        filePath: document.uri.fsPath,
        text: document.getText(),
        workspaceRoot: root,
        configPath: this.settings(document.uri).configPath,
        allowCustomRules: vscode.workspace.isTrusted,
      });
      if (document.version !== version) return;
      this.results.set(document.uri.toString(), { documentVersion: version, result });
      this.diagnostics.set(
        document.uri,
        result.errors.map((error) => this.toDiagnostic(error)),
      );
    } catch (error) {
      this.output.appendLine(this.errorMessage(error));
    }
  }

  private async lintWorkspace(): Promise<void> {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const settings = this.settings(folder.uri);
      const results = await engine.lintWorkspace({
        workspaceRoot: folder.uri.fsPath,
        globs: settings.workspaceGlobs,
        configPath: settings.configPath,
        allowCustomRules: vscode.workspace.isTrusted,
      });
      const count = results.reduce((total, result) => total + result.errors.length, 0);
      this.output.appendLine(`${folder.name}: ${count} problem(s)`);
    }
    this.output.show(true);
  }

  private async openConfig(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (folder === undefined) return;
    for (const name of SUPPORTED_CONFIG_FILES) {
      const uri = vscode.Uri.joinPath(folder.uri, name);
      if (await this.exists(uri)) return void (await vscode.window.showTextDocument(uri));
    }
    const doc = await vscode.workspace.openTextDocument({
      language: "jsonc",
      content: '{\n  "rules": {}\n}\n',
    });
    await vscode.window.showTextDocument(doc);
  }

  private disable(): void {
    this.liveEnabled = false;
    this.diagnostics.clear();
  }

  private async enable(): Promise<void> {
    this.liveEnabled = true;
    await this.lintVisible();
  }

  private async fixAll(): Promise<void> {
    const doc = vscode.window.activeTextEditor?.document;
    if (doc === undefined) return;
    const fixed = await this.fixedText(doc);
    if (fixed === null || fixed === doc.getText()) return;
    const full = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
    await vscode.window.activeTextEditor?.edit((builder) => builder.replace(full, fixed));
  }

  private async previewFixes(): Promise<void> {
    const doc = vscode.window.activeTextEditor?.document;
    if (doc === undefined) return;
    const fixed = await this.fixedText(doc);
    this.output.appendLine(
      fixed === null || fixed === doc.getText()
        ? "No fixes available."
        : "Fixes would change the active document.",
    );
    this.output.show(true);
  }

  private async fixedText(document: vscode.TextDocument): Promise<string | null> {
    const root = this.workspaceRoot(document.uri);
    if (root === null) return null;
    const result = await engine.fixDocument({
      filePath: document.uri.fsPath,
      text: document.getText(),
      workspaceRoot: root,
      configPath: this.settings(document.uri).configPath,
      allowCustomRules: vscode.workspace.isTrusted,
    });
    return result.text;
  }

  private codeActions(
    document: vscode.TextDocument,
    diagnostics: readonly vscode.Diagnostic[],
  ): vscode.CodeAction[] {
    const stored = this.results.get(document.uri.toString());
    if (stored === undefined) return [];
    const actions = diagnostics.flatMap((diag) =>
      this.quickFixes(document, diag, stored.result.errors),
    );
    actions.push(this.fixAllAction());
    return actions;
  }

  private quickFixes(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    errors: readonly LintError[],
  ): vscode.CodeAction[] {
    const code = String(
      typeof diagnostic.code === "object" ? diagnostic.code.value : diagnostic.code,
    );
    const error = errors.find(
      (entry) => entry.ruleCode === code && entry.message === diagnostic.message,
    );
    const actions: vscode.CodeAction[] = [];
    if (error?.fix !== undefined)
      actions.push(this.quickFixAction(document, diagnostic, error as FixableError));
    const helpUrl = ruleDocumentationUrl(code);
    if (helpUrl !== null) actions.push(this.helpAction(code, helpUrl));
    return actions;
  }

  private quickFixAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    error: FixableError,
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Apply ${error.ruleCode} fix`,
      vscode.CodeActionKind.QuickFix,
    );
    const edit = new vscode.WorkspaceEdit();
    const fix = fixToTextEdit(error.fix);
    edit.replace(document.uri, this.range(fix.range), fix.newText);
    action.edit = edit;
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return action;
  }

  private helpAction(code: string, helpUrl: string): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Open ${code} documentation`,
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      command: COMMANDS.openRuleHelp,
      title: "Open Rule Documentation",
      arguments: [code, helpUrl],
    };
    return action;
  }

  private fixAllAction(): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Fix all markdownlint-obsidian problems",
      vscode.CodeActionKind.SourceFixAll,
    );
    action.command = { command: COMMANDS.fixAll, title: "Fix All" };
    return action;
  }

  private async openRuleHelp(code: string, explicitUrl?: string): Promise<void> {
    const url = explicitUrl ?? ruleDocumentationUrl(code);
    if (url !== null) await vscode.env.openExternal(vscode.Uri.parse(url));
  }

  private toDiagnostic(error: LintError): vscode.Diagnostic {
    const data = lintErrorToDiagnosticData(error);
    const diagnostic = new vscode.Diagnostic(
      this.range(data.range),
      data.message,
      this.severity(data),
    );
    diagnostic.source = data.source;
    const helpUrl = ruleDocumentationUrl(data.code);
    diagnostic.code =
      helpUrl === null ? data.code : { value: data.code, target: vscode.Uri.parse(helpUrl) };
    return diagnostic;
  }

  private range(range: {
    readonly start: { readonly line: number; readonly character: number };
    readonly end: { readonly line: number; readonly character: number };
  }): vscode.Range {
    return new vscode.Range(
      range.start.line,
      range.start.character,
      range.end.line,
      range.end.character,
    );
  }

  private severity(data: DiagnosticData): vscode.DiagnosticSeverity {
    return data.severity === "error"
      ? vscode.DiagnosticSeverity.Error
      : vscode.DiagnosticSeverity.Warning;
  }

  private snapshot(document: vscode.TextDocument): DocumentSnapshot {
    return {
      uri: document.uri.toString(),
      fsPath: document.uri.scheme === "file" ? document.uri.fsPath : null,
      scheme: document.uri.scheme,
      languageId: document.languageId,
      version: document.version,
      isUntitled: document.isUntitled,
      text: document.getText(),
    };
  }

  private settings(resource: vscode.Uri): ExtensionSettings {
    return readExtensionSettings(vscode.workspace.getConfiguration(CONFIG_SECTION, resource));
  }

  private session(): { readonly liveDiagnosticsEnabled: boolean } {
    return { liveDiagnosticsEnabled: this.liveEnabled };
  }

  private dependency(): DependencyState {
    return detectFlavorGrenade(vscode.extensions);
  }

  private workspaceRoot(uri: vscode.Uri): string | null {
    return (
      vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath ??
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ??
      null
    );
  }

  private async exists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  private clear(uri: vscode.Uri): void {
    this.diagnostics.delete(uri);
    this.results.delete(uri.toString());
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

type FixableError = LintError & { readonly fix: Fix };

export function activate(context: vscode.ExtensionContext): void {
  new ExtensionRuntime(context).activate();
}

export function deactivate(): void {}
