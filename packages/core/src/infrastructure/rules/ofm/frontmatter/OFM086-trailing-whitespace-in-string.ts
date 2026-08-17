/** @module infrastructure/rules/ofm/frontmatter/OFM086-trailing-whitespace-in-string */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import type { Fix } from "../../../../domain/linting/Fix.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

const KEY_LINE = /^([A-Za-z0-9_-]+)\s*:/;

/**
 * OFM086 — frontmatter-trailing-whitespace.
 *
 * Walks every string value reachable from `parsed.frontmatter` (including
 * nested maps and array elements) and warns if it ends with one or more
 * spaces or tabs. Marked fixable for the future Phase 9 autofix engine,
 * which will rewrite the YAML in place.
 *
 * Autofix is only emitted for simple top-level scalar values (`path.length === 1`)
 * whose value can be located on the key's raw line. Nested map values, array
 * elements, and multi-line scalars report the violation without a fix because
 * the trailing whitespace does not live on the key line — splicing there would
 * corrupt the frontmatter.
 *
 * @see docs/rules/frontmatter/OFM086.md
 */
export const OFM086Rule: OFMRule = {
  names: ["OFM086", "frontmatter-trailing-whitespace"],
  description: "Frontmatter string value has trailing whitespace",
  tags: ["frontmatter", "whitespace"],
  severity: "warning",
  coordinateSpace: "absolute",
  fixable: true,
  run({ parsed }, onError) {
    // Build a map of top-level key → 1-based absolute line number by scanning
    // frontmatterRaw the same way OFM085 does. This gives accurate line
    // numbers for every violation instead of always reporting line 1.
    const keyLineMap = buildKeyLineMap(parsed.frontmatterRaw);
    walk(parsed.frontmatter, [], keyLineMap, parsed.frontmatterRaw, onError);
  },
};

/**
 * Scan `frontmatterRaw` line-by-line and record the first occurrence of each
 * top-level key (non-indented lines matching `KEY_LINE`).
 *
 * The returned line numbers are 1-based absolute positions in the file:
 * `i + 2` because the opening `---` separator occupies line 1 and the raw
 * text is 0-indexed.
 */
function buildKeyLineMap(raw: string | null): Map<string, number> {
  const map = new Map<string, number>();
  if (raw === null) return map;
  raw.split(/\r?\n/).forEach((lineText, i) => recordKeyLine(lineText, i, map));
  return map;
}

function recordKeyLine(lineText: string, i: number, map: Map<string, number>): void {
  if (/^\s/.test(lineText)) return;
  const match = lineText.match(KEY_LINE);
  if (match === null) return;
  const key = match[1] ?? "";
  if (!map.has(key)) {
    // +1 for the opening separator line, +1 to convert to 1-based.
    map.set(key, i + 2);
  }
}

type Emit = (e: { line: number; column: number; message: string; fix?: Fix }) => void;

function walk(
  value: unknown,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  frontmatterRaw: string | null,
  emit: Emit,
): void {
  if (typeof value === "string") {
    checkString(value, path, keyLineMap, frontmatterRaw, emit);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, [...path, String(i)], keyLineMap, frontmatterRaw, emit));
    return;
  }
  if (value !== null && typeof value === "object") {
    walkObject(value as Record<string, unknown>, path, keyLineMap, frontmatterRaw, emit);
  }
}

// Only emit a fix for simple top-level scalars (path.length === 1).
// For nested maps or array elements the line number points to the parent
// key, not the actual value line, so autofix is deferred.
function buildTopLevelFix(
  path: readonly string[],
  line: number,
  trimmedValue: string,
  trailingCount: number,
  frontmatterRaw: string | null,
): Fix | undefined {
  if (path.length !== 1) return undefined;
  const editColumn = findTrailingWhitespaceColumn(line, trimmedValue, frontmatterRaw);
  if (editColumn === null) return undefined;
  return makeFix({
    lineNumber: line,
    editColumn,
    deleteCount: trailingCount,
    insertText: "",
  });
}

function checkString(
  value: string,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  frontmatterRaw: string | null,
  emit: Emit,
): void {
  if (!value.endsWith(" ") && !value.endsWith("\t")) return;
  const where = path.length === 0 ? "(root)" : path.join(".");
  const topKey = path[0];
  const line = (topKey !== undefined && keyLineMap.get(topKey)) || 1;
  const trimmedValue = value.trimEnd();
  const trailingCount = value.length - trimmedValue.length;
  const fix = buildTopLevelFix(path, line, trimmedValue, trailingCount, frontmatterRaw);
  emit({
    line,
    column: 1,
    message: `Frontmatter value at "${where}" has trailing whitespace`,
    ...(fix !== undefined ? { fix } : {}),
  });
}

function findTrailingWhitespaceColumn(
  absoluteLine: number,
  trimmedValue: string,
  frontmatterRaw: string | null,
): number | null {
  const rawLine = rawFrontmatterLine(absoluteLine, frontmatterRaw);
  if (rawLine === undefined) return null;
  return locateTrailingWhitespaceColumn(rawLine, trimmedValue);
}

function rawFrontmatterLine(
  absoluteLine: number,
  frontmatterRaw: string | null,
): string | undefined {
  if (frontmatterRaw === null) return undefined;
  // frontmatterRaw starts at the line after the opening `---` (index 0 = line 2 of the file).
  const rawLines = frontmatterRaw.split(/\r?\n/);
  return rawLines[absoluteLine - 2];
}

function locateTrailingWhitespaceColumn(rawLine: string, trimmedValue: string): number | null {
  if (trimmedValue.length === 0) {
    return findWhitespaceOnlyValueColumn(rawLine);
  }
  // Search only in the value portion (after the colon) to avoid false matches
  // when the key name is a substring of the value (e.g., `Note: "Note  "`).
  const colonIdx = rawLine.indexOf(":");
  const searchFrom = colonIdx === -1 ? 0 : colonIdx + 1;
  const idx = rawLine.indexOf(trimmedValue, searchFrom);
  // A miss means the value spans multiple raw lines (multi-line YAML scalar):
  // the trailing whitespace lives on a later line we cannot locate here.
  return idx === -1 ? null : idx + trimmedValue.length + 1;
}

function findWhitespaceOnlyValueColumn(rawLine: string): number | null {
  const endIndex = findWhitespaceOnlyValueScanEnd(rawLine);
  const start = findHorizontalWhitespaceRunStart(rawLine, endIndex);
  return start === endIndex ? null : start + 2;
}

function findWhitespaceOnlyValueScanEnd(rawLine: string): number {
  let end = rawLine.length - 1;
  while (end >= 0 && isHorizontalWhitespace(rawLine.charCodeAt(end))) end--;
  return isYamlQuote(rawLine[end]) ? end - 1 : rawLine.length - 1;
}

function findHorizontalWhitespaceRunStart(rawLine: string, endIndex: number): number {
  let start = endIndex;
  while (start >= 0 && isHorizontalWhitespace(rawLine.charCodeAt(start))) start--;
  return start;
}

function isHorizontalWhitespace(char: number): boolean {
  return char === 0x20 || char === 0x09;
}

function isYamlQuote(char: string | undefined): boolean {
  return char === '"' || char === "'";
}

function walkObject(
  obj: Record<string, unknown>,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  frontmatterRaw: string | null,
  emit: Emit,
): void {
  for (const [k, v] of Object.entries(obj)) {
    walk(v, [...path, k], keyLineMap, frontmatterRaw, emit);
  }
}
