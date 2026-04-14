/**
 * Purpose: Lint rule that reports wikilinks whose block reference targets a missing block id.
 *
 * Provides: {@link OFM102Rule}
 *
 * Role in system: Performs a cross-file check using the shared `BlockRefIndex` and `vault`
 * resolver; for each `[[page#^blockid]]` link whose target page resolves successfully it
 * verifies the block id exists in the index, catching broken anchors that only surface at
 * read time.
 *
 * @module infrastructure/rules/ofm/block-references/OFM102-broken-block-link
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM102 — broken-block-link.
 *
 * Reports every `[[page#^blockid]]` whose target page exists but does not
 * declare the referenced block. Phase 6 supersedes the Phase 4 placeholder
 * OFM007 with this cross-file check via the shared {@link BlockRefIndex}.
 *
 * Skips links whose target page does not resolve (OFM001 already reports
 * those) and links that have no block-reference component (OFM007 handled
 * the subset earlier; it now aliases to this rule).
 *
 * @see docs/rules/block-references/OFM102.md
 */
export const OFM102Rule: OFMRule = {
  names: ["OFM102", "broken-block-link"],
  description: "Wikilink block reference targets a missing block id",
  tags: ["block-references", "wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed, vault, blockRefIndex }, onError) {
    if (vault === null || blockRefIndex === null) return;
    for (const link of parsed.wikilinks) {
      if (link.blockRef === null) continue;
      const match = vault.resolve(link);
      if (match.kind !== "resolved") continue;
      if (!blockRefIndex.has(match.path.relative, link.blockRef)) {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Block link "[[${link.target}#^${link.blockRef}]]" targets unknown block id`,
        });
      }
    }
  },
};
