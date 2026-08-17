/**
 * Purpose: Lint rule that detects lines with an odd number of `==` markers indicating an unterminated highlight.
 *
 * Provides: {@link OFM122Rule}
 *
 * Role in system: Scans body lines outside fenced code blocks (tracked via
 * {@link updateFence}), strips inline backtick code via {@link stripInlineCode} to
 * avoid false positives on `===` operators, then counts `==` markers per line to
 * surface unterminated highlight spans.
 *
 * @module infrastructure/rules/ofm/highlights/OFM122-malformed-highlight
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { scannableLines } from "./shared/scannableText.js";

/**
 * OFM122 — malformed-highlight.
 *
 * Reports prose lines with an odd number of `==` markers. Each well-formed
 * `==highlight==` span contributes two markers, so an odd count is a reliable
 * signal of an unterminated highlight. Prose lines are extracted from the
 * markdown-it token stream (via {@link scannableLines}), so code blocks,
 * indented code, inline code, HTML, and link/image destinations never
 * contribute markers — regardless of stray fence markers in pasted content.
 *
 * @see docs/rules/highlights/OFM122.md
 */
export const OFM122Rule: OFMRule = {
  names: ["OFM122", "malformed-highlight"],
  description: "Unmatched `==` markers on a single line",
  tags: ["highlights", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const [line, text] of scannableLines(parsed.tokens)) {
      const markers = text.match(/==/g);
      if (markers !== null && markers.length % 2 !== 0) {
        onError({
          line,
          column: 1,
          message: `Unmatched '==' on line (count ${markers.length})`,
        });
      }
    }
  },
};
