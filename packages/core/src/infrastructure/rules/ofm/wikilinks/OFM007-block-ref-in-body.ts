/**
 * Purpose: Provide a backward-compatible alias of OFM102 under the OFM007 name for block-reference wikilink validation.
 *
 * Provides: {@link OFM007Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM007 — deprecated alias that delegates block-reference wikilink validation to OFM102, preserving config compatibility.
 *
 * @module infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { OFM102Rule } from "../block-references/OFM102-broken-block-link.js";

/**
 * OFM007 — wikilink-block-ref (deprecated).
 *
 * Phase 4 introduced OFM007 as a placeholder that only checked whether the
 * target *file* of `[[page#^blockid]]` existed. Phase 6 ships the full
 * cross-file block-id validation as {@link OFM102Rule}, so OFM007 is now a
 * pure alias that delegates to the same implementation under its old name.
 * The alias keeps existing `.obsidian-linter.jsonc` files that reference
 * `rules.OFM007` working without a config migration.
 *
 * New vaults should reference OFM102 directly; OFM007 will be removed in
 * a future major version.
 *
 * @deprecated Superseded by OFM102 in Phase 6.
 * @see docs/rules/wikilinks/OFM007.md
 */
export const OFM007Rule: OFMRule = {
  ...OFM102Rule,
  names: ["OFM007", "wikilink-block-ref"],
  description: "Block-reference wikilink target is broken (alias of OFM102)",
};
