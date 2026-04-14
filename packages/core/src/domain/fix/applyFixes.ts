/**
 * Purpose: Applies a list of text-edit fixes to raw file content, resolving conflicts between overlapping edits.
 *
 * Provides: {@link applyFixes}, {@link ApplyResult}
 *
 * Role in system: The sole pure algorithm in the fix pipeline — called by the application layer after rules have emitted their {@link Fix} objects. Has no I/O and no external dependencies, making it trivially testable and safe to run in any environment.
 *
 * @module domain/fix/applyFixes
 */
import type { Fix } from "../linting/Fix.js";
import type { FixConflict } from "../linting/FixConflict.js";

export interface ApplyResult {
  readonly patched: string;
  readonly conflicts: readonly FixConflict[];
}

/**
 * Pure function — no I/O, no side effects.
 *
 * Applies a list of fixes to raw file content, processing each line's fixes
 * end-to-start (descending editColumn) so that earlier column positions remain
 * valid after each splice. When two fixes on the same line have overlapping
 * column ranges the later one (lower editColumn) is skipped and recorded in
 * the returned `conflicts` array.
 *
 * All column numbers are 1-based, matching Fix / LintError conventions.
 */
export function applyFixes(raw: string, fixes: readonly Fix[], filePath = ""): ApplyResult {
  // Split on \n only — trailing \r on each line is preserved naturally
  const lines = raw.split("\n");
  const conflicts: FixConflict[] = [];
  const byLine = groupByLine(fixes);

  for (const [lineNumber, list] of byLine.entries()) {
    applyLineGroup(lines, lineNumber, list, filePath, conflicts);
  }

  return { patched: lines.join("\n"), conflicts };
}

function groupByLine(fixes: readonly Fix[]): Map<number, Fix[]> {
  const byLine = new Map<number, Fix[]>();
  for (const fix of fixes) {
    const list = byLine.get(fix.lineNumber) ?? [];
    list.push(fix);
    byLine.set(fix.lineNumber, list);
  }
  return byLine;
}

function applyLineGroup(
  lines: string[],
  lineNumber: number,
  list: Fix[],
  filePath: string,
  conflicts: FixConflict[],
): void {
  // Sort descending by editColumn — end-of-line edits first keeps earlier positions valid.
  const sorted = [...list].sort((a, b) => b.editColumn - a.editColumn);
  const accepted: Fix[] = [];

  for (const fix of sorted) {
    const overlapping = accepted.find((a) => rangesIntersect(a, fix));
    if (overlapping !== undefined) {
      conflicts.push({
        filePath,
        first: overlapping,
        second: fix,
        reason: `Overlap on line ${lineNumber}`,
      });
      continue;
    }
    accepted.push(fix);
    spliceLine(lines, lineNumber, fix);
  }
}

function spliceLine(lines: string[], lineNumber: number, fix: Fix): void {
  const idx = lineNumber - 1; // convert 1-based line to 0-based index
  const line = lines[idx] ?? "";
  const col = fix.editColumn - 1; // convert 1-based column to 0-based index
  lines[idx] = line.slice(0, col) + fix.insertText + line.slice(col + fix.deleteCount);
}

function rangesIntersect(a: Fix, b: Fix): boolean {
  const aEnd = a.editColumn + a.deleteCount;
  const bEnd = b.editColumn + b.deleteCount;
  // Same anchor always conflicts (catches zero-width insertion vs deletion at same column).
  if (a.editColumn === b.editColumn) return true;
  // Standard half-open interval overlap check.
  return a.editColumn < bEnd && b.editColumn < aEnd;
}
