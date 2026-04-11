import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM002 — invalid-wikilink-format.
 *
 * Scans raw source lines for malformed wikilink patterns that the extractor
 * silently discards. The three cases we flag:
 *
 *   1. Empty wikilink: `[[]]` (with optional whitespace).
 *   2. Unclosed wikilink: a line starting a wikilink that never closes.
 *   3. Nested wikilink: `[[ ... [[` on the same line.
 *
 * Code fences and inline code are intentionally *not* excluded yet — this
 * matches markdownlint's behaviour for malformed-link rules and keeps the
 * implementation simple. Phase 9 autofix prep can revisit this.
 *
 * @see docs/rules/wikilinks/OFM002.md
 */
const EMPTY_RE = /\[\[\s*\]\]/g;
const NESTED_RE = /\[\[[^\]]*\[\[/;

export const OFM002Rule: OFMRule = {
  names: ["OFM002", "invalid-wikilink-format"],
  description: "Wikilink syntax is malformed",
  tags: ["wikilinks", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      const lineNumber = i + 1;

      for (const m of line.matchAll(EMPTY_RE)) {
        onError({
          line: lineNumber,
          column: (m.index ?? 0) + 1,
          message: "Empty wikilink `[[]]`",
        });
      }

      // Unclosed: a `[[` without a matching `]]` on the same line.
      // We check the last occurrence of `[[` and ensure a `]]` follows it.
      const lastOpen = line.lastIndexOf("[[");
      if (lastOpen !== -1) {
        const afterOpen = line.slice(lastOpen);
        if (!afterOpen.includes("]]")) {
          onError({
            line: lineNumber,
            column: lastOpen + 1,
            message: "Unclosed wikilink — missing `]]`",
          });
        }
      }

      if (NESTED_RE.test(line)) {
        onError({
          line: lineNumber,
          column: 1,
          message: "Nested wikilink `[[ ... [[`",
        });
      }
    });
  },
};
