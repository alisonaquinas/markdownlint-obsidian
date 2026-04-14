/**
 * Purpose: Lint rule that warns when the same tag value appears more than once in body text.
 *
 * Provides: {@link OFM064Rule}
 *
 * Role in system: Maintains a seen-map over the file's extracted tags and reports every
 * repeat occurrence, with case-sensitivity controlled by `config.tags.caseSensitive`.
 *
 * @module infrastructure/rules/ofm/tags/OFM064-duplicate-tag
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM064 — duplicate-tag.
 *
 * Warns when the same tag value appears more than once in body text.
 * Comparison honours `tags.caseSensitive`. The first occurrence is kept;
 * every subsequent occurrence fires a warning that points back at the
 * original line.
 *
 * @see docs/rules/tags/OFM064.md
 */
export const OFM064Rule: OFMRule = {
  names: ["OFM064", "duplicate-tag"],
  description: "The same tag is repeated within one file",
  tags: ["tags"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    const seen = new Map<string, { line: number; column: number }>();
    for (const tag of parsed.tags) {
      const key = config.tags.caseSensitive ? tag.value : tag.value.toLowerCase();
      const prior = seen.get(key);
      if (prior !== undefined) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Duplicate tag "${tag.raw}" (first seen on line ${prior.line})`,
        });
      } else {
        seen.set(key, { line: tag.position.line, column: tag.position.column });
      }
    }
  },
};
