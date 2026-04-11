import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM007 — wikilink-block-ref.
 *
 * Warns when a block-reference wikilink (`[[page#^blockid]]`) targets a
 * file that doesn't exist in the vault. Phase 6 strengthens this with
 * cross-file blockid validation via the dedicated OFM102 rule; this Phase 4
 * version only checks that the target file itself resolves.
 *
 * @see docs/rules/wikilinks/OFM007.md
 */
export const OFM007Rule: OFMRule = {
  names: ["OFM007", "wikilink-block-ref"],
  description: "Block-reference wikilink target file not found",
  tags: ["wikilinks", "block-refs"],
  severity: "warning",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      if (link.blockRef === null) continue;
      const match = vault.resolve(link);
      if (match.kind === "not-found") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Block-reference target file "${link.target}" not found`,
        });
      }
    }
  },
};
