import type { LintResult } from "markdownlint-obsidian/api";
import { fixText, lintText, lintWorkspace } from "markdownlint-obsidian/editor";
import type { LintDocumentRequest, LintEngine, WorkspaceLintRequest } from "../shared/types.js";

export class CoreLibraryAdapter implements LintEngine {
  async lintDocument(request: LintDocumentRequest): Promise<LintResult> {
    return lintText({
      cwd: request.workspaceRoot,
      vaultRoot: request.workspaceRoot,
      config: request.configPath ?? request.workspaceRoot,
      allowCustomRules: request.allowCustomRules,
      filePath: request.filePath,
      text: request.text,
    });
  }

  async fixDocument(
    request: LintDocumentRequest,
  ): Promise<{ readonly text: string; readonly result: LintResult }> {
    const outcome = await fixText({
      cwd: request.workspaceRoot,
      vaultRoot: request.workspaceRoot,
      config: request.configPath ?? request.workspaceRoot,
      allowCustomRules: request.allowCustomRules,
      filePath: request.filePath,
      text: request.text,
    });
    const result = outcome.finalPass[0] ?? outcome.firstPass[0];
    if (result === undefined) throw new Error("fixDocument did not produce a lint result");
    return { text: outcome.text, result };
  }

  async lintWorkspace(request: WorkspaceLintRequest): Promise<readonly LintResult[]> {
    return lintWorkspace({
      cwd: request.workspaceRoot,
      vaultRoot: request.workspaceRoot,
      config: request.configPath ?? request.workspaceRoot,
      allowCustomRules: request.allowCustomRules,
      globs: request.globs,
    });
  }
}
