import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { buildCodeRegionMap } from "../../../parser/ofm/CodeRegionMap.js";

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
      const lineNumber = i + 1;

      for (const m of line.matchAll(EMPTY_RE)) {
        const column = (m.index ?? 0) + 1;
        if (codeMap.isInCode(lineNumber, column)) continue;
        onError({
          line: lineNumber,
          column,
          message: "Empty wikilink `[[]]`",
        });
      }

      // Unclosed: the last `[[` on the line has no matching `]]` after it.
      const lastOpen = line.lastIndexOf("[[");
      if (lastOpen !== -1 && !codeMap.isInCode(lineNumber, lastOpen + 1)) {
        const afterOpen = line.slice(lastOpen);
        if (!afterOpen.includes("]]")) {
          onError({
            line: lineNumber,
            column: lastOpen + 1,
            message: "Unclosed wikilink — missing `]]`",
          });
        }
      }

      for (const m of line.matchAll(NESTED_RE)) {
        const column = (m.index ?? 0) + 1;
        if (codeMap.isInCode(lineNumber, column)) continue;
        onError({
          line: lineNumber,
          column,
          message: "Nested wikilink `[[ ... [[`",
        });
        break; // one report per line is plenty
      }
    });
  },
};
