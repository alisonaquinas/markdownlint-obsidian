/**
 * Purpose: Lint rule that flags non-string entries in a frontmatter `tags` array.
 *
 * Provides: {@link OFM087Rule}
 *
 * Role in system: Validates each element of the frontmatter `tags` array is a string,
 * catching numbers, booleans, nested maps, and arrays that would be silently accepted
 * by the YAML parser but rejected by Obsidian's tag indexer.
 *
 * @module infrastructure/rules/ofm/frontmatter/OFM087-non-string-tag-entry
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM087 — non-string-tag-entry.
 *
 * If the file has a `tags:` array in frontmatter, every entry must be a
 * string. Numbers, booleans, nested maps, and arrays each fire a violation.
 * A non-array `tags` value is OFM083's responsibility, not ours.
 *
 * @see docs/rules/frontmatter/OFM087.md
 */
export const OFM087Rule: OFMRule = {
  names: ["OFM087", "non-string-tag-entry"],
  description: "Frontmatter tags array contains a non-string entry",
  tags: ["frontmatter", "tags"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const tags = (parsed.frontmatter as { tags?: unknown }).tags;
    if (!Array.isArray(tags)) return;
    for (let i = 0; i < tags.length; i += 1) {
      if (typeof tags[i] !== "string") {
        onError({
          line: 1,
          column: 1,
          message: `Frontmatter tags[${i}] must be a string, got ${typeof tags[i]}`,
        });
      }
    }
  },
};
