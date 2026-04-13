import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { updateFence, stripInlineCode } from "../shared/fenceStateMachine.js";

/**
 * Returns true if the line contains a truly nested highlight.
 *
 * A nested highlight occurs when an opening `==` marker is followed by
 * content that itself ends with a space before the greedy-closing `==`,
 * indicating the author intended a larger outer span with an inner `==...==`
 * pair inside it (e.g. `==outer ==inner== text==`).
 *
 * Strategy: split the line on `==` to get alternating segments.  With 0-based
 * indexing, odd segments (1, 3, 5…) are the content *inside* each greedy
 * highlight pair.  A nested highlight is signalled when an odd-indexed segment
 * ends with whitespace — meaning the `==` that "closes" that segment is really
 * an inner opener rather than a proper closing delimiter.
 *
 * Only segments that contain non-whitespace characters AND end with
 * whitespace are flagged.  Pure-whitespace segments (e.g. the `" "` from
 * `== ==`) are skipped — they represent invalid/empty spans, not nesting.
 *
 * Examples (segments after split on `==`):
 *
 *   "==a== and ==b=="
 *     → ["", "a", " and ", "b", ""]
 *     odd segments: "a", "b"  — neither ends with space → no nesting ✓
 *
 *   "==outer ==inner== text=="
 *     → ["", "outer ", "inner", " text", ""]
 *     odd segment "outer " has content and ends with space → nested ✓
 *
 *   "== =="  (whitespace-only span from code doc examples)
 *     → ["", " ", ""]
 *     odd segment " " is pure whitespace → skipped → no nesting ✓
 */
function hasNestedHighlight(line: string): boolean {
  const parts = line.split("==");
  // A single ==...== span produces exactly 3 parts: ["", content, ""].
  // With only 3 parts there is no room for a second == pair, so nesting
  // is impossible regardless of trailing whitespace in the content.
  if (parts.length <= 3) return false;
  // Odd-indexed parts are the content between each greedy ==...== pair.
  // If any of them ends with whitespace, the closing `==` is an inner
  // opener rather than a proper delimiter — that is a nested highlight.
  for (let i = 1; i < parts.length; i += 2) {
    const segment = parts[i];
    // Only flag segment[i] when there are more parts after the presumed
    // inner span (i.e. parts.length > i + 2).  This ensures a trailing
    // space in a single span like `==foo ==` is never treated as nesting.
    if (
      segment !== undefined &&
      segment.trim().length > 0 &&
      /\s$/.test(segment) &&
      parts.length > i + 2
    ) {
      return true;
    }
  }
  return false;
}

/**
 * OFM123 — nested-highlight.
 *
 * Reports lines that contain a truly nested highlight, i.e. a `==...==` span
 * whose interior contains another `==` marker (`==outer ==inner== text==`).
 * Obsidian cannot render such constructs; the inner pair closes the outer one
 * and the trailing `==` becomes stray text.
 *
 * Adjacent highlights on the same line (`==a== and ==b==`) are NOT flagged;
 * each forms its own valid, non-overlapping span.
 *
 * Inline backtick code is stripped before scanning so `==` operators inside
 * inline code do not contribute to the check.
 *
 * @see docs/rules/highlights/OFM123.md
 */
export const OFM123Rule: OFMRule = {
  names: ["OFM123", "nested-highlight"],
  description: "Highlight span contains another == marker inside it (nested highlight)",
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
      if (hasNestedHighlight(scanned)) {
        onError({
          line: i + 1,
          column: 1,
          message: "Nested highlight detected",
        });
      }
    });
  },
};
