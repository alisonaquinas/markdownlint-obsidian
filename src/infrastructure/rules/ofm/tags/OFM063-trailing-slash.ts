import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

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
        });
      }
    }
  },
};
