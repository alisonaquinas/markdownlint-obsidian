/**
 * Purpose: Detect wikilinks whose basename matches more than one file in the vault, making the target ambiguous.
 *
 * Provides: {@link OFM004Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM004 — flags wikilinks with ambiguous targets that match multiple vault files.
 *
 * @module infrastructure/rules/ofm/wikilinks/OFM004-ambiguous-target
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM004 — ambiguous-wikilink-target.
 *
 * Emits an error for every wikilink whose basename matches more than one
 * `.md` file in the vault. Writing `[[index]]` when both `notes/index.md`
 * and `archive/index.md` exist is ambiguous; the fix is to use the full
 * relative path.
 *
 * @see docs/rules/wikilinks/OFM004.md
 */
export const OFM004Rule: OFMRule = {
  names: ["OFM004", "ambiguous-wikilink-target"],
  description: "Wikilink basename matches multiple files",
  tags: ["wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      const match = vault.resolve(link);
      if (match.kind === "ambiguous") {
        const candidates = match.candidates.map((c) => c.relative).join(", ");
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink "${link.target}" is ambiguous — matches: ${candidates}`,
        });
      }
    }
  },
};
