/**
 * Runtime adapter between VS Code extension code and the bundled
 * `markdownlint-obsidian` editor APIs.
 *
 * This is the only production module that calls the core lint engine. It keeps
 * the extension from shelling out to the CLI and keeps OFM rule semantics inside
 * the core package.
 *
 * @module core/coreLibraryAdapter
 */

import type { LintResult } from "markdownlint-obsidian/api";
import { fixText, lintText, lintWorkspace } from "markdownlint-obsidian/editor";
import type { LintDocumentRequest, LintEngine, WorkspaceLintRequest } from "../shared/types.js";

/** Implements the extension lint-engine boundary using bundled library calls. */
export class CoreLibraryAdapter implements LintEngine {
  /** Lint one in-memory editor document without requiring the file to be saved. */
  async lintDocument(request: LintDocumentRequest): Promise<LintResult> {
    return lintText({
      cwd: request.workspaceRoot,
      config: request.configPath ?? request.workspaceRoot,
      allowCustomRules: request.allowCustomRules,
      filePath: request.filePath,
      text: request.text,
    });
  }

  /** Apply safe core fixes to one in-memory document and return the fixed text. */
  async fixDocument(
    request: LintDocumentRequest,
  ): Promise<{ readonly text: string; readonly result: LintResult }> {
    const outcome = await fixText({
      cwd: request.workspaceRoot,
      config: request.configPath ?? request.workspaceRoot,
      allowCustomRules: request.allowCustomRules,
      filePath: request.filePath,
      text: request.text,
    });
    const result = outcome.finalPass[0] ?? outcome.firstPass[0];
    if (result === undefined) throw new Error("fixDocument did not produce a lint result");
    return { text: outcome.text, result };
  }

  /** Lint workspace files using the configured glob set and workspace root. */
  async lintWorkspace(request: WorkspaceLintRequest): Promise<readonly LintResult[]> {
    return lintWorkspace({
      cwd: request.workspaceRoot,
      config: request.configPath ?? request.workspaceRoot,
      allowCustomRules: request.allowCustomRules,
      globs: request.globs,
    });
  }
}
