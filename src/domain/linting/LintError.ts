/**
 * Single auto-fix instruction emitted by a fixable rule.
 *
 * Coordinates are 1-based to match {@link LintError} positions.
 */
export interface Fix {
  readonly lineNumber: number;
  readonly editColumn: number;
  readonly deleteCount: number;
  readonly insertText: string;
}

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
