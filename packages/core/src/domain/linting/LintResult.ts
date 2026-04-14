/**
 * Purpose: Defines the immutable value object that aggregates all lint errors for a single file.
 *
 * Provides: {@link LintResult}, {@link makeLintResult}
 *
 * Role in system: The per-file output of the linting use case, consumed by formatters and the CLI exit-code logic. The `hasErrors` flag follows the severity policy (warnings do not fail the run), keeping that decision in the domain rather than scattered across consumers.
 *
 * @module domain/linting/LintResult
 */
import type { LintError } from "./LintError.js";

/**
 * Immutable value object holding all lint errors discovered for a single file.
 *
 * `hasErrors` is `true` only when at least one error has severity `"error"` —
 * warnings alone do not flip the flag (this matches the CLI exit-code policy).
 */
export interface LintResult {
  readonly filePath: string;
  readonly errors: readonly LintError[];
  readonly hasErrors: boolean;
}

/**
 * Construct a frozen {@link LintResult} for a file.
 *
 * @param filePath - Absolute or vault-relative path of the linted file.
 * @param errors - All errors emitted by rules for this file.
 * @returns A frozen LintResult.
 */
export function makeLintResult(filePath: string, errors: LintError[]): LintResult {
  return Object.freeze({
    filePath,
    errors: Object.freeze([...errors]),
    hasErrors: errors.some((e) => e.severity === "error"),
  });
}
