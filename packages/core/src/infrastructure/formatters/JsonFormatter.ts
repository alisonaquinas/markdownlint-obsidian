/**
 * Purpose: Serialises lint results as a pretty-printed JSON array for machine-readable output.
 *
 * Provides: {@link formatJson}
 *
 * Role in system: Infrastructure output adapter registered in {@link FormatterRegistry} as
 * the `"json"` formatter; it produces a stable, always-valid JSON document from
 * {@link LintResult} data, enabling downstream tools and scripts to parse lint output
 * without text-scraping.
 *
 * @module infrastructure/formatters/JsonFormatter
 */
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
