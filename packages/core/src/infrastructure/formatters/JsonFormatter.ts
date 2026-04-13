import type { LintResult } from "../../domain/linting/LintResult.js";

/**
 * Format lint results as a pretty-printed JSON array.
 *
 * The returned string is always valid JSON even when `results` is empty
 * (`[]`). Consumers that parse the output must handle the empty-array case.
 *
 * @param results - Per-file results to serialise.
 * @returns A JSON string with two-space indentation.
 */
export function formatJson(results: readonly LintResult[]): string {
  return JSON.stringify(
    results.map((r) => ({
      filePath: r.filePath,
      errors: r.errors.map((e) => ({ ...e })),
    })),
    null,
    2,
  );
}
