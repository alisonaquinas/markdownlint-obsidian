import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { isValidTag } from "./shared/TagFormat.js";

/**
 * OFM060 — invalid-tag-format.
 *
 * Iterate every body-text tag the parser extracted and validate its value
 * against {@link isValidTag}. Most malformed tags (whitespace, leading
 * digits) never reach the rule because the extractor filters them out, but
 * edge cases such as `#a//b` slip through and are caught here.
 *
 * @see docs/rules/tags/OFM060.md
 */
export const OFM060Rule: OFMRule = {
  names: ["OFM060", "invalid-tag-format"],
  description: "Tag contains characters outside Obsidian's allowed set",
  tags: ["tags"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const tag of parsed.tags) {
      if (!isValidTag(tag.value)) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Invalid tag "${tag.raw}"`,
        });
      }
    }
  },
};
