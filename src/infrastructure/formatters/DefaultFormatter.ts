import type { LintResult } from "../../domain/linting/LintResult.js";

/**
 * Format lint results as human-readable text.
 *
 * Each violation is rendered on its own line as
 * `file:line:col CODE message`. Clean results produce an empty string so the
 * CLI prints nothing for a passing run.
 *
 * @param results - Per-file results to render.
 * @returns Plain-text output or an empty string when no violations exist.
 */
export function formatDefault(results: readonly LintResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    for (const err of result.errors) {
      lines.push(
        `${result.filePath}:${err.line}:${err.column} ${err.ruleCode} ${err.message}`,
      );
    }
  }

  return lines.join("\n");
}
