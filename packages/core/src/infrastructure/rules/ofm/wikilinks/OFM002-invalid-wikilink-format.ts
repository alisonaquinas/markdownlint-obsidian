import type { OFMRule, OnErrorCallback } from "../../../../domain/linting/OFMRule.js";
import { buildCodeRegionMap, type CodeRegionMap } from "../../../parser/ofm/CodeRegionMap.js";

/**
 * OFM002 — invalid-wikilink-format.
 *
 * Scans raw source lines for malformed wikilink patterns that the extractor
 * silently discards. The three cases we flag:
 *
 *   1. Empty wikilink: `[[]]` (with optional whitespace).
 *   2. Unclosed wikilink: a line starting a wikilink that never closes.
 *   3. Nested wikilink: `[[ ... [[` on the same line.
 *
 * Matches inside fenced code blocks or inline code are ignored — this
 * mirrors the wikilink extractor's behaviour and prevents false positives on
 * documentation that *describes* malformed syntax inside code fences.
 *
 * @see docs/rules/wikilinks/OFM002.md
 */
const EMPTY_RE = /\[\[\s*\]\]/g;
const NESTED_RE = /\[\[[^\]]*\[\[/g;

export const OFM002Rule: OFMRule = {
  names: ["OFM002", "invalid-wikilink-format"],
  description: "Wikilink syntax is malformed",
  tags: ["wikilinks", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const codeMap = buildCodeRegionMap(parsed.lines);
    parsed.lines.forEach((line, i) => {
      checkLine(line, i + 1, codeMap, onError);
    });
  },
};

function checkLine(
  line: string,
  lineNumber: number,
  codeMap: CodeRegionMap,
  onError: OnErrorCallback,
): void {
  reportEmpty(line, lineNumber, codeMap, onError);
  reportUnclosed(line, lineNumber, codeMap, onError);
  reportNested(line, lineNumber, codeMap, onError);
}

function reportEmpty(
  line: string,
  lineNumber: number,
  codeMap: CodeRegionMap,
  onError: OnErrorCallback,
): void {
  for (const m of line.matchAll(EMPTY_RE)) {
    const column = (m.index ?? 0) + 1;
    if (codeMap.isInCode(lineNumber, column)) continue;
    onError({ line: lineNumber, column, message: "Empty wikilink `[[]]`" });
  }
}

function reportUnclosed(
  line: string,
  lineNumber: number,
  codeMap: CodeRegionMap,
  onError: OnErrorCallback,
): void {
  const lastOpen = line.lastIndexOf("[[");
  if (lastOpen === -1) return;
  if (codeMap.isInCode(lineNumber, lastOpen + 1)) return;
  if (line.slice(lastOpen).includes("]]")) return;
  onError({
    line: lineNumber,
    column: lastOpen + 1,
    message: "Unclosed wikilink — missing `]]`",
  });
}

function reportNested(
  line: string,
  lineNumber: number,
  codeMap: CodeRegionMap,
  onError: OnErrorCallback,
): void {
  for (const m of line.matchAll(NESTED_RE)) {
    const column = (m.index ?? 0) + 1;
    if (codeMap.isInCode(lineNumber, column)) continue;
    onError({ line: lineNumber, column, message: "Nested wikilink `[[ ... [[`" });
    return; // one report per line is plenty
  }
}
