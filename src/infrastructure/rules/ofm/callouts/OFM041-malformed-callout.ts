import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

// A line that looks like it is trying to be a callout header: starts with
// `>` followed by any whitespace and then `[`. This is a loose sniff so
// we only descend to the strict check when there is a plausible candidate.
const LOOKS_LIKE_HEADER = /^>\s*\[/;

// The same grammar the CalloutExtractor uses. A line that matches this is
// a well-formed callout header (possibly with a fold marker and title).
const STRICT_HEADER = /^>\s*\[!([A-Za-z][A-Za-z0-9-]*)\][+-]?(\s.*)?$/;

/**
 * OFM041 — malformed-callout.
 *
 * Catches lines that look like they are trying to open a callout but do
 * not conform to the grammar used by Obsidian (and by our extractor).
 * Examples include `> [!NOTE]Title` (missing space after `]`),
 * `> [!] Title` (missing type), and `> [ NOTE ] Title` (stray spaces).
 * Well-formed callouts are silently skipped; lines that don't look like
 * headers at all (regular quote blocks) are also skipped.
 *
 * This is a quality-of-life rule — the malformed lines would otherwise
 * render as opaque quote blocks with no indication that the author meant
 * a callout.
 */
export const OFM041Rule: OFMRule = {
  names: ["OFM041", "malformed-callout"],
  description: "Line looks like a callout header but does not parse",
  tags: ["callouts", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      if (!LOOKS_LIKE_HEADER.test(line)) return;
      if (STRICT_HEADER.test(line)) return;
      onError({
        line: i + 1,
        column: 1,
        message: `Malformed callout header: "${line.trim()}"`,
      });
    });
  },
};
