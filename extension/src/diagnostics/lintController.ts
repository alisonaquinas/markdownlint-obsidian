/**
 * Generic live-lint coordinator for tests and future runtime extraction.
 *
 * The current extension runtime performs VS Code wiring directly, while this
 * controller preserves the pure orchestration shape: snapshot a document, call
 * the lint engine, ignore stale results, and publish or report outcomes through
 * a host adapter.
 *
 * @module diagnostics/lintController
 */

import type { LintError, LintResult } from "markdownlint-obsidian/api";
import type { LintEngine } from "../shared/types.js";

/** Host callbacks needed by {@link LintController} without importing VS Code. */
export interface LintControllerHost<TDocument> {
  snapshot(document: TDocument): {
    readonly filePath: string;
    readonly text: string;
    readonly version: number;
    readonly workspaceRoot: string;
    readonly configPath: string | null;
    readonly allowCustomRules: boolean;
  } | null;
  publish(document: TDocument, result: LintResult): void;
  clear(document: TDocument, reason: string): void;
  report(message: string): void;
}

/** Coordinates lint requests while preventing stale results from overwriting newer diagnostics. */
export class LintController<TDocument> {
  private readonly versions = new Map<string, number>();

  constructor(
    private readonly engine: LintEngine,
    private readonly host: LintControllerHost<TDocument>,
  ) {}

  /**
   * Lint a document snapshot and publish only if the document version is still current.
   *
   * @param document - Host-specific document object.
   * @param key - Stable document key used to track the latest requested version.
   */
  async lint(document: TDocument, key: string): Promise<void> {
    const snapshot = this.host.snapshot(document);
    if (snapshot === null) {
      this.host.clear(document, "ineligible");
      return;
    }
    this.versions.set(key, snapshot.version);
    try {
      const result = await this.engine.lintDocument(snapshot);
      if (this.versions.get(key) === snapshot.version) this.host.publish(document, result);
    } catch (error) {
      this.host.report(formatError(error));
    }
  }

  /** Return the lint errors from a result without exposing result internals to callers. */
  errors(result: LintResult): readonly LintError[] {
    return result.errors;
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
