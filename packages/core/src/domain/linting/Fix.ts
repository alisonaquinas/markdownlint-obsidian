/**
 * Purpose: Defines the atomic text-edit value object emitted by fixable rules.
 *
 * Provides: {@link Fix}, {@link makeFix}
 *
 * Role in system: The smallest unit of autofix data in the domain — every fixable {@link LintError} carries a Fix that {@link applyFixes} consumes to patch the source file. The factory validates 1-based coordinates before freezing the object.
 *
 * @module domain/linting/Fix
 */

/**
 * An atomic text edit produced by a fixable rule. Immutable.
 *
 * The edit window is defined as "starting at column `editColumn` on line
 * `lineNumber`, delete `deleteCount` characters, then insert `insertText`".
 * All positions are 1-based to match LintError.
 */
export interface Fix {
  readonly lineNumber: number;
  readonly editColumn: number;
  readonly deleteCount: number;
  readonly insertText: string;
}

export function makeFix(fields: Fix): Fix {
  if (fields.lineNumber < 1) throw new Error("Fix.lineNumber must be >= 1");
  if (fields.editColumn < 1) throw new Error("Fix.editColumn must be >= 1");
  if (fields.deleteCount < 0) throw new Error("Fix.deleteCount must be >= 0");
  return Object.freeze({ ...fields });
}
