import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import type { Fix } from "../../../../domain/linting/Fix.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

const TRAILING_WS = /[ \t]+$/;
const KEY_LINE = /^([A-Za-z0-9_-]+)\s*:/;

/**
 * OFM086 — frontmatter-trailing-whitespace.
 *
 * Walks every string value reachable from `parsed.frontmatter` (including
 * nested maps and array elements) and warns if it ends with one or more
 * spaces or tabs. Marked fixable for the future Phase 9 autofix engine,
 * which will rewrite the YAML in place.
 *
 * @see docs/rules/frontmatter/OFM086.md
 */
export const OFM086Rule: OFMRule = {
  names: ["OFM086", "frontmatter-trailing-whitespace"],
  description: "Frontmatter string value has trailing whitespace",
  tags: ["frontmatter", "whitespace"],
  severity: "warning",
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

function checkString(
  value: string,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  frontmatterRaw: string | null,
  emit: Emit,
): void {
  if (!TRAILING_WS.test(value)) return;
  const where = path.length === 0 ? "(root)" : path.join(".");
  const topKey = path[0];
  const line = (topKey !== undefined && keyLineMap.get(topKey)) || 1;
  const trailingCount = value.length - value.trimEnd().length;
  const trimmedValue = value.trimEnd();
  const editColumn = findTrailingWhitespaceColumn(line, trimmedValue, frontmatterRaw);
  emit({
    line,
    column: 1,
    message: `Frontmatter value at "${where}" has trailing whitespace`,
    fix: makeFix({ lineNumber: line, editColumn, deleteCount: trailingCount, insertText: "" }),
  });
}

/**
 * Find the 1-based column where trailing whitespace starts on the given
 * (1-based, absolute file) line within frontmatterRaw.
 *
 * Strategy: locate the raw YAML line, find the trimmed value string within
 * it, then return the column immediately after. Falls back to column 1 when
 * the line or value cannot be located.
 */
function findTrailingWhitespaceColumn(
  absoluteLine: number,
  trimmedValue: string,
  frontmatterRaw: string | null,
): number {
  const rawLine = rawFrontmatterLine(absoluteLine, frontmatterRaw);
  if (rawLine === undefined) return 1;
  return locateTrailingWhitespaceColumn(rawLine, trimmedValue);
}

/**
 * Return the raw YAML line (0-based within frontmatterRaw) that corresponds
 * to `absoluteLine` (1-based in the file, where line 1 is the `---` opener).
 */
function rawFrontmatterLine(
  absoluteLine: number,
  frontmatterRaw: string | null,
): string | undefined {
  if (frontmatterRaw === null) return undefined;
  // frontmatterRaw starts at the line after the opening `---` (index 0 = line 2 of the file).
  const rawLines = frontmatterRaw.split(/\r?\n/);
  return rawLines[absoluteLine - 2];
}

/**
 * Given a raw YAML line and the trimmed value, return the 1-based column
 * where the trailing whitespace begins (i.e. the character after the trimmed value).
 */
function locateTrailingWhitespaceColumn(rawLine: string, trimmedValue: string): number {
  if (trimmedValue.length === 0) {
    const wsMatch = rawLine.match(/[ \t]+(?=["']?\s*$)/);
    return wsMatch !== null && wsMatch.index !== undefined ? wsMatch.index + 1 : 1;
  }
  const idx = rawLine.indexOf(trimmedValue);
  return idx === -1 ? 1 : idx + trimmedValue.length + 1;
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
