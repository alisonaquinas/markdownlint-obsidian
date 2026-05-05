import type { LintError, LintResult } from "markdownlint-obsidian/api";
import type { LintEngine } from "../shared/types.js";

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

export class LintController<TDocument> {
  private readonly versions = new Map<string, number>();

  constructor(
    private readonly engine: LintEngine,
    private readonly host: LintControllerHost<TDocument>,
  ) {}

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

  errors(result: LintResult): readonly LintError[] {
    return result.errors;
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
