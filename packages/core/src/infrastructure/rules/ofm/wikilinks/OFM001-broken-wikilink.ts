import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM001 — broken-wikilink.
 *
 * Emits an error for every wikilink whose target cannot be resolved in the
 * vault index. Embed-style wikilinks (`![[...]]`) are skipped because the
 * embed rule family (OFM020-series, Phase 5) owns that territory. When the
 * vault index is `null` (e.g. `--no-resolve` or `resolve: false`) this rule
 * does nothing.
 *
 * @see docs/rules/wikilinks/OFM001.md
 */
export const OFM001Rule: OFMRule = {
  names: ["OFM001", "no-broken-wikilinks"],
  description: "Wikilink target does not resolve within the vault",
  tags: ["wikilinks", "links"],
  severity: "error",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      if (link.isEmbed) continue;
      const match = vault.resolve(link);
      if (match.kind === "not-found") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Broken wikilink: target "${link.target}" not found in vault`,
        });
      }
    }
  },
};
