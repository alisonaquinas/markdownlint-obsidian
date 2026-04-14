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
import { updateFence, stripInlineCode } from "../shared/fenceStateMachine.js";

/**
 * OFM122 — malformed-highlight.
 *
 * Reports lines with an odd number of `==` markers outside fenced code.
 * Each well-formed `==highlight==` span contributes two markers, so an odd
 * count is a reliable signal of an unterminated highlight.
 *
 * Inline backtick code is stripped before counting so prose that references
 * JavaScript's `===` operator does not trip the rule. Fenced code blocks
 * are also skipped. The rule deliberately does not understand
 * `markdown-it`-level inline-code positions; the backtick pre-pass is
 * precise enough for documentation-style writing.
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
    let fence: string | null = null;
    parsed.lines.forEach((line, i) => {
      const step = updateFence(line, fence);
      fence = step.fence;
      if (step.skip) return;
      const scanned = stripInlineCode(line);
      const markers = scanned.match(/==/g);
      if (markers !== null && markers.length % 2 !== 0) {
        onError({
          line: i + 1,
          column: 1,
          message: `Unmatched '==' on line (count ${markers.length})`,
        });
      }
    });
  },
};
