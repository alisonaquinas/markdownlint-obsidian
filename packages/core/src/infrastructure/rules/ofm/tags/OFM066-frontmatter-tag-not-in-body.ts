import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM066 — frontmatter-tag-not-in-body.
 *
 * Warns when a tag listed in the file's frontmatter `tags:` array is never
 * referenced in the body. Disabled by default in `DEFAULT_CONFIG` because
 * many vaults intentionally tag notes via frontmatter alone.
 *
 * @see docs/rules/tags/OFM066.md
 */
export const OFM066Rule: OFMRule = {
  names: ["OFM066", "frontmatter-tag-not-in-body"],
  description: "Tag declared in frontmatter is never used in the body",
  tags: ["tags", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    const fmTags = (parsed.frontmatter as { tags?: unknown }).tags;
    if (!Array.isArray(fmTags)) return;
    const body = new Set(parsed.tags.map((t) => t.value.toLowerCase()));
    for (const t of fmTags) {
      if (typeof t !== "string") continue;
      if (!body.has(t.toLowerCase())) {
        onError({
          line: 1,
          column: 1,
          message: `Frontmatter tag "${t}" not used in body`,
        });
      }
    }
  },
};
