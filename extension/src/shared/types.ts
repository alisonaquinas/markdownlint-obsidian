import type { LintResult } from "markdownlint-obsidian/api";

export type RunMode = "onType" | "onSave";

export interface ExtensionSettings {
  readonly enabled: boolean;
  readonly runMode: RunMode;
  readonly debounceMs: number;
  readonly configPath: string | null;
  readonly workspaceGlobs: readonly string[];
}

export type DependencyStatus = "installed-active" | "installed-inactive" | "missing";

export interface DependencyState {
  readonly id: string;
  readonly status: DependencyStatus;
}

export interface SessionState {
  readonly liveDiagnosticsEnabled: boolean;
}

export interface DocumentSnapshot {
  readonly uri: string;
  readonly fsPath: string | null;
  readonly scheme: string;
  readonly languageId: string;
  readonly version: number;
  readonly isUntitled: boolean;
  readonly text: string;
}

export interface EligibilityDecision {
  readonly eligible: boolean;
  readonly reason: string | null;
}

export interface TextPosition {
  readonly line: number;
  readonly character: number;
}

export interface TextRange {
  readonly start: TextPosition;
  readonly end: TextPosition;
}

export interface DiagnosticData {
  readonly range: TextRange;
  readonly severity: "error" | "warning";
  readonly source: "markdownlint-obsidian";
  readonly code: string;
  readonly message: string;
  readonly fixable: boolean;
}

export interface TextEditData {
  readonly range: TextRange;
  readonly newText: string;
}

export interface LintDocumentRequest {
  readonly filePath: string;
  readonly text: string;
  readonly workspaceRoot: string;
  readonly configPath: string | null;
  readonly allowCustomRules: boolean;
}

export interface WorkspaceLintRequest {
  readonly workspaceRoot: string;
  readonly globs: readonly string[];
  readonly configPath: string | null;
  readonly allowCustomRules: boolean;
}

export interface LintEngine {
  lintDocument(request: LintDocumentRequest): Promise<LintResult>;
  fixDocument(
    request: LintDocumentRequest,
  ): Promise<{ readonly text: string; readonly result: LintResult }>;
  lintWorkspace(request: WorkspaceLintRequest): Promise<readonly LintResult[]>;
}
