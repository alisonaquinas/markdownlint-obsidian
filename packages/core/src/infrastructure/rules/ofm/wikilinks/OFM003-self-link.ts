import * as path from "node:path";
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM003 — self-link.
 *
 * Warns on wikilinks whose resolved target is the same file the link lives
 * in. Self-links are usually intentional (sidebars, navigation blocks), so
 * this rule is disabled by default. Vaults that forbid them can opt in.
 *
 * @see docs/rules/wikilinks/OFM003.md
 */
export const OFM003Rule: OFMRule = {
  names: ["OFM003", "self-link"],
  description: "Wikilink points back at the same file",
  tags: ["wikilinks", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    const selfAbs = path.resolve(parsed.filePath);
    const selfStem = path.basename(parsed.filePath, path.extname(parsed.filePath));
    for (const link of parsed.wikilinks) {
      const match = vault.resolve(link);
      if (match.kind !== "resolved") continue;
      if (match.path.absolute === selfAbs) {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Self-link to "${selfStem}" in ${path.basename(parsed.filePath)}`,
        });
      }
    }
  },
};
