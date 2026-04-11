import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/;

interface FenceResult {
  readonly fence: string | null;
  readonly skip: boolean;
}

/**
 * Advance a simple fence state machine over a line. Mirrors the helper in
 * OFM041 so OFM122 stays consistent with the "fenced code is skipped"
 * policy. Phase 6 deferred the shared `CodeRegionMap` refactor (see the
 * reviewer note in the Phase 6 plan); when that lands this logic should
 * collapse into a lookup on `ParseResult.codeRegions`.
 */
function updateFence(line: string, fence: string | null): FenceResult {
  const fenceMatch = line.match(FENCE_PATTERN);
  if (fence !== null) {
    const closed = fenceMatch !== null && line.trim().startsWith(fence);
    return { fence: closed ? null : fence, skip: true };
  }
  if (fenceMatch !== null) {
    return { fence: fenceMatch[2] ?? null, skip: true };
  }
  return { fence: null, skip: false };
}

/**
 * OFM122 — malformed-highlight.
 *
 * Reports lines with an odd number of `==` markers outside fenced code.
 * Each well-formed `==highlight==` span contributes two markers, so an odd
 * count is a reliable signal of an unterminated highlight.
 *
 * Known false-positive surface: lines containing `===` (triple-equals) in
 * prose — e.g. JavaScript identity-check snippets written in inline code.
 * Fenced code blocks are filtered out to shrink that surface; the rule
 * accepts the inline-code false-positive risk in exchange for a simple
 * implementation.
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
      const markers = line.match(/==/g);
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
