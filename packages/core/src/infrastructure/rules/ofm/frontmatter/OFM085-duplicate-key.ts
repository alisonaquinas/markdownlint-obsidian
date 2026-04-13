import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const KEY_LINE = /^([A-Za-z0-9_-]+)\s*:/;

/**
 * OFM085 - duplicate-frontmatter-key.
 *
 * Scans `parsed.frontmatterRaw` line-by-line and reports any top-level key
 * that appears more than once. Nested-map indentation disqualifies a line,
 * so only top-level duplicates are flagged.
 *
 * NOTE: gray-matter (js-yaml) currently throws OFM902 on duplicate top-level
 * keys before OFM085 has a chance to fire, so this rule is effectively a
 * forward-compat net for any future tolerant parser. The synthetic-input
 * unit test demonstrates the intended behaviour.
 *
 * @see docs/rules/frontmatter/OFM085.md
 */
export const OFM085Rule: OFMRule = {
  names: ["OFM085", "duplicate-frontmatter-key"],
  description: "Same frontmatter key declared twice in YAML",
  tags: ["frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const raw = parsed.frontmatterRaw;
    if (raw === null) return;
    const seen = new Map<string, number>();
    const rawLines = raw.split(/\r?\n/);
    for (let i = 0; i < rawLines.length; i += 1) {
      const lineText = rawLines[i] ?? "";
      const match = lineText.match(KEY_LINE);
      if (match === null) continue;
      const key = match[1] ?? "";
      // +1 for the opening separator, +1 to convert to 1-based line number.
      const absLine = i + 2;
      const prior = seen.get(key);
      if (prior !== undefined) {
        onError({
          line: absLine,
          column: 1,
          message: `Duplicate frontmatter key "${key}" (also on line ${prior})`,
        });
      } else {
        seen.set(key, absLine);
      }
    }
  },
};
