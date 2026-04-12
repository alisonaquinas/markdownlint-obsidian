import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM124 — empty-highlight.
 *
 * A highlight with no (non-whitespace) content — typically `====` or
 * `==  ==`. Obsidian renders these as empty spans; they are almost always
 * left over after a refactor. Marked `fixable: true`; the autofixer lives
 * in Phase 9 and will delete the offending marker pair.
 *
 * @see docs/rules/highlights/OFM124.md
 */
export const OFM124Rule: OFMRule = {
  names: ["OFM124", "empty-highlight"],
  description: "Highlight contains no text",
  tags: ["highlights"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    for (const h of parsed.highlights) {
      if (h.text.trim().length === 0) {
        onError({
          line: h.position.line,
          column: h.position.column,
          message: "Empty highlight `====`",
        });
      }
    }
  },
};
