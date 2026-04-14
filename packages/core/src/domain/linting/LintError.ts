/**
 * Purpose: Defines the immutable value object representing a single rule violation in a Markdown file.
 *
 * Provides: {@link LintError}, {@link makeLintError}
 *
 * Role in system: The canonical output of every {@link OFMRule}; collected per file into a {@link LintResult} and ultimately reported by formatters or used to drive autofix. Structural identity means two errors with identical fields are considered equal.
 *
 * @module domain/linting/LintError
 */
import type { Fix } from "./Fix.js";
export type { Fix } from "./Fix.js";

/**
 * Immutable value object describing a single rule violation in a Markdown file.
 *
 * Identity is structural — two LintErrors with identical fields are equal.
 * Lines and columns are 1-based.
 */
export interface LintError {
  readonly ruleCode: string;
  readonly ruleName: string;
  readonly severity: "error" | "warning";
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly fixable: boolean;
  readonly fix?: Fix;
}

/**
 * Construct a frozen {@link LintError} from raw fields.
 *
 * @param fields - All required LintError fields, with optional `fix`.
 * @returns A frozen LintError instance safe to share across threads.
 */
export function makeLintError(fields: Omit<LintError, "fix"> & { fix?: Fix }): LintError {
  return Object.freeze({ ...fields });
}
