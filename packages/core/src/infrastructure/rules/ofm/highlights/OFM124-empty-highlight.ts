/**
 * Purpose: Lint rule that warns on highlight spans that contain no non-whitespace text.
 *
 * Provides: {@link OFM124Rule}
 *
 * Role in system: Iterates the parser's extracted highlight list and flags any whose `.text`
 * trims to empty, catching leftover `====` or `==  ==` artifacts from refactors; emits a
 * fixable warning whose Phase-9 autofix deletes the entire empty marker pair.
 *
 * @module infrastructure/rules/ofm/highlights/OFM124-empty-highlight
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

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
          fix: makeFix({
            lineNumber: h.position.line,
            editColumn: h.position.column,
            deleteCount: h.text.length + 4,
            insertText: "",
          }),
        });
      }
    }
  },
};
