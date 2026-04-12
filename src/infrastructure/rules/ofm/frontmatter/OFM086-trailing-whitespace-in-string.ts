import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

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
    walk(parsed.frontmatter, [], keyLineMap, onError);
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
  const rawLines = raw.split(/\r?\n/);
  for (let i = 0; i < rawLines.length; i += 1) {
    const lineText = rawLines[i] ?? "";
    // Only match top-level keys (no leading whitespace).
    if (/^\s/.test(lineText)) continue;
    const match = lineText.match(KEY_LINE);
    if (match === null) continue;
    const key = match[1] ?? "";
    if (!map.has(key)) {
      // +1 for the opening separator line, +1 to convert to 1-based.
      map.set(key, i + 2);
    }
  }
  return map;
}

type Emit = (e: { line: number; column: number; message: string }) => void;

function walk(
  value: unknown,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  emit: Emit,
): void {
  if (typeof value === "string") {
    checkString(value, path, keyLineMap, emit);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, [...path, String(i)], keyLineMap, emit));
    return;
  }
  if (value !== null && typeof value === "object") {
    walkObject(value as Record<string, unknown>, path, keyLineMap, emit);
  }
}

function checkString(
  value: string,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  emit: Emit,
): void {
  if (!TRAILING_WS.test(value)) return;
  const where = path.length === 0 ? "(root)" : path.join(".");
  // The top-level key is the first segment of the path. Look it up in the map
  // built from frontmatterRaw; fall back to line 1 if the key is not found
  // (e.g. when frontmatterRaw is null or the key uses characters outside
  // KEY_LINE's alphabet).
  const topKey = path[0];
  const line = (topKey !== undefined && keyLineMap.get(topKey)) || 1;
  emit({
    line,
    column: 1,
    message: `Frontmatter value at "${where}" has trailing whitespace`,
  });
}

function walkObject(
  obj: Record<string, unknown>,
  path: readonly string[],
  keyLineMap: Map<string, number>,
  emit: Emit,
): void {
  for (const [k, v] of Object.entries(obj)) {
    walk(v, [...path, k], keyLineMap, emit);
  }
}
