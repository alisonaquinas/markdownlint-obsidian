/**
 * Purpose: Lint rule that warns when a block id contains uppercase letters.
 *
 * Provides: {@link OFM104Rule}
 *
 * Role in system: Enforces the convention that block ids should be fully lowercase to avoid
 * case-sensitivity bugs in `[[page#^Id]]` vs `[[page#^id]]` links; emits a fixable warning
 * whose Phase-9 autofix replaces the id with its lowercase equivalent.
 *
 * @module infrastructure/rules/ofm/block-references/OFM104-block-id-format
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

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
          fix: makeFix({
            lineNumber: ref.position.line,
            editColumn: ref.position.column + 1,
            deleteCount: ref.blockId.length,
            insertText: ref.blockId.toLowerCase(),
          }),
        });
      }
    }
  },
};
