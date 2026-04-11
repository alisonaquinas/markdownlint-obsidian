import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const EMPTY_TAG = /(?:^|\s)(#\/?)(?:\s|$)/;

/**
 * OFM062 — empty-tag.
 *
 * Detects a lone `#` or `#/` token surrounded by whitespace, which is the
 * usual symptom of an author starting a tag and never finishing it. Tag
 * extraction silently drops these because they have no following character.
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
      const match = line.match(EMPTY_TAG);
      if (match === null) return;
      const offset = match.index ?? 0;
      // The capture group sits one char to the right of the leading space
      // (when the match did not anchor at the start of the line).
      const column = offset + (match[0].startsWith(match[1] ?? "") ? 1 : 2);
      onError({
        line: i + 1,
        column,
        message: `Empty tag "${match[1]}"`,
      });
    });
  },
};
