/**
 * Purpose: Detect wikilinks that resolve only via case-insensitive fallback, indicating a case mismatch with the canonical filename.
 *
 * Provides: {@link OFM005Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM005 — warns when a wikilink target only resolves case-insensitively and offers an autofix to the canonical spelling.
 *
 * @module infrastructure/rules/ofm/wikilinks/OFM005-case-mismatch
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

/**
 * OFM005 — wikilink-case-mismatch.
 *
 * Warns when a wikilink resolves only because case-insensitive fallback
 * matched. The canonical file spelling is reported so vaults that rely on
 * case-sensitive filesystems (e.g. Linux CI publishing to macOS) don't break
 * at publish time.
 *
 * @see docs/rules/wikilinks/OFM005.md
 */
export const OFM005Rule: OFMRule = {
  names: ["OFM005", "wikilink-case-mismatch"],
  description: "Wikilink target only resolves case-insensitively",
  tags: ["wikilinks", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      const match = vault.resolve(link);
      if (match.kind === "resolved" && match.strategy === "case-insensitive") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink "${link.target}" case differs from canonical "${match.path.relative}"`,
          fix: makeFix({
            lineNumber: link.position.line,
            editColumn: link.position.column + 2,
            deleteCount: link.target.length,
            insertText: match.path.relative,
          }),
        });
      }
    }
  },
};
