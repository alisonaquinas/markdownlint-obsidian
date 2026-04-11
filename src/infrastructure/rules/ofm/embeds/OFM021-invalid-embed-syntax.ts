import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

// Use `g` so matchAll can iterate over every occurrence on a single line.
const EMPTY_EMBED = /!\[\[\s*\]\]/g;
// Detects an unclosed `![[` that is not followed by `]]` anywhere on the line.
// We only flag it when there is no `]]` on the same line; multi-line embeds
// are not part of the OFM grammar, so this is a safe heuristic.
const OPEN_BRACKETS = /!\[\[/;

/**
 * OFM021 — invalid-embed-syntax.
 *
 * Catches two malformed patterns the parser does not materialise as
 * {@link EmbedNode}s (so OFM020/022 never see them):
 *
 *   1. `![[]]` with a whitespace-only body: fired per occurrence.
 *   2. `![[foo` with no closing `]]` on the same line: fired once per line.
 *
 * Code regions are not filtered here — the `parsed.lines` array is raw, and
 * malformed syntax inside a fenced code block is not something this rule
 * can distinguish from prose. In practice embed syntax is rare inside code,
 * so false positives are negligible. If they become a problem we can wire
 * this into {@link CodeRegionMap} later.
 */
export const OFM021Rule: OFMRule = {
  names: ["OFM021", "invalid-embed-syntax"],
  description: "Embed syntax is malformed",
  tags: ["embeds", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      const lineNumber = i + 1;
      for (const m of line.matchAll(EMPTY_EMBED)) {
        onError({
          line: lineNumber,
          column: (m.index ?? 0) + 1,
          message: "Empty embed `![[]]`",
        });
      }
      if (OPEN_BRACKETS.test(line) && !line.includes("]]")) {
        onError({
          line: lineNumber,
          column: 1,
          message: "Unclosed embed — missing `]]`",
        });
      }
    });
  },
};
