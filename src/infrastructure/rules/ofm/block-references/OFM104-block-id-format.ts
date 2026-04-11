import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM104 — block-id-case.
 *
 * Style warning that surfaces block ids containing uppercase letters.
 * Obsidian is case-sensitive on block-id resolution, so mixing `^Intro`
 * and `^intro` can produce subtle "wrong anchor" bugs; keeping every id
 * lowercase removes an entire class of oversight.
 *
 * Marked `fixable: true`; the autofixer lives in Phase 9 and will replace
 * the identifier with its lowercase equivalent.
 *
 * @see docs/rules/block-references/OFM104.md
 */
export const OFM104Rule: OFMRule = {
  names: ["OFM104", "block-id-case"],
  description: "Block id contains uppercase letters",
  tags: ["block-references", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    for (const ref of parsed.blockRefs) {
      if (ref.blockId !== ref.blockId.toLowerCase()) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: `Block id "^${ref.blockId}" should be lowercase`,
        });
      }
    }
  },
};
