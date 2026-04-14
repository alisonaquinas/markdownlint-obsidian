/**
 * Purpose: Lint rule that catches tags whose value ends with a trailing slash.
 *
 * Provides: {@link OFM063Rule}
 *
 * Role in system: Identifies the narrow pattern of tags like `#area/` and emits a
 * fixable error; the autofix in Phase 9 trims the trailing slash to produce a valid
 * Obsidian tag.
 *
 * @module infrastructure/rules/ofm/tags/OFM063-trailing-slash
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

/**
 * OFM063 — tag-trailing-slash.
 *
 * Catches the narrow case of a tag whose value ends with `/`, e.g. `#area/`.
 * Marked fixable for Phase 9 (the autofix simply trims the trailing slash).
 *
 * @see docs/rules/tags/OFM063.md
 */
export const OFM063Rule: OFMRule = {
  names: ["OFM063", "tag-trailing-slash"],
  description: "Nested tag ends with a trailing slash",
  tags: ["tags"],
  severity: "error",
  fixable: true,
  run({ parsed }, onError) {
    for (const tag of parsed.tags) {
      if (tag.value.endsWith("/")) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Tag "${tag.raw}" has a trailing slash`,
          fix: makeFix({
            lineNumber: tag.position.line,
            editColumn: tag.position.column + tag.raw.length - 1,
            deleteCount: 1,
            insertText: "",
          }),
        });
      }
    }
  },
};
