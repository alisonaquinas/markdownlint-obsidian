import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

/**
 * OFM065 — mixed-case-tag.
 *
 * Warns when a tag's casing differs from the first occurrence of the same
 * lowercased value within the file. No-op when `tags.caseSensitive` is true,
 * since case differences are then meaningful and should not be flagged.
 *
 * @see docs/rules/tags/OFM065.md
 */
export const OFM065Rule: OFMRule = {
  names: ["OFM065", "mixed-case-tag"],
  description: "Tag casing differs from its earlier occurrence",
  tags: ["tags", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed, config }, onError) {
    if (config.tags.caseSensitive) return;
    const canonical = new Map<string, string>();
    for (const tag of parsed.tags) {
      const key = tag.value.toLowerCase();
      const seen = canonical.get(key);
      if (seen === undefined) {
        canonical.set(key, tag.value);
      } else if (seen !== tag.value) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Tag "${tag.raw}" case differs from earlier "${seen}"`,
          fix: makeFix({
            lineNumber: tag.position.line,
            editColumn: tag.position.column,
            deleteCount: tag.raw.length,
            insertText: "#" + seen,
          }),
        });
      }
    }
  },
};
