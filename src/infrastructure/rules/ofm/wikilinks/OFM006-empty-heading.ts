import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM006 — empty-wikilink-heading.
 *
 * Errors when a wikilink declares a heading fragment (`#`) without any
 * heading text (`[[page#]]`). Obsidian renders this but it never resolves
 * to a meaningful target.
 *
 * The wikilink extractor already drops the empty heading to `null` on
 * `link.heading`, so this rule re-parses `link.raw` to detect the lone
 * trailing `#`. We only flag when the raw text contains `#` outside of a
 * block-ref (`#^`) and no meaningful heading text follows.
 *
 * @see docs/rules/wikilinks/OFM006.md
 */
const EMPTY_HEADING_RE = /\[\[[^\]]*?#\s*(?:\||\]\])/;

export const OFM006Rule: OFMRule = {
  names: ["OFM006", "empty-wikilink-heading"],
  description: "Wikilink declares `#` with no heading text",
  tags: ["wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const link of parsed.wikilinks) {
      if (link.heading !== null) continue; // heading text already present
      if (link.blockRef !== null) continue; // `#^blockref` is not an empty heading
      if (!EMPTY_HEADING_RE.test(link.raw)) continue;
      onError({
        line: link.position.line,
        column: link.position.column,
        message: `Wikilink "${link.raw}" has an empty heading after '#'`,
      });
    }
  },
};
