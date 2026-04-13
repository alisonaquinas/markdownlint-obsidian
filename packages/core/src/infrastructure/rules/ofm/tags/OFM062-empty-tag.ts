import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const EMPTY_TAG = /(\s)(#\/?)(?:\s|$)/;
const ATX_HEADING = /^#{1,6}(\s|$)/;

/**
 * OFM062 — empty-tag.
 *
 * Detects a lone `#` or `#/` token surrounded by whitespace, which is the
 * usual symptom of an author starting a tag and never finishing it. Tag
 * extraction silently drops these because they have no following character.
 *
 * Lines that look like ATX headings (`#`–`######` followed by space) are
 * skipped — they are headings, not tag attempts.
 *
 * @see docs/rules/tags/OFM062.md
 */
export const OFM062Rule: OFMRule = {
  names: ["OFM062", "empty-tag"],
  description: "A lone '#' or '#/' is not a valid tag",
  tags: ["tags"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      if (ATX_HEADING.test(line)) return;
      const match = line.match(EMPTY_TAG);
      if (match === null) return;
      const offset = match.index ?? 0;
      // Match captures the leading whitespace, so the empty-tag token sits
      // at offset + 1 (1-based column).
      const column = offset + 2;
      onError({
        line: i + 1,
        column,
        message: `Empty tag "${match[2]}"`,
      });
    });
  },
};
