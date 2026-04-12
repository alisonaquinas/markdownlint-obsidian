import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

// `==a ==b== c==` — three pairs of `==` separated by non-`=` characters on
// a single line. The pattern cannot tell "nested" apart from "two adjacent
// highlights on one line" (`==a== and ==b==`), so it fires on both. The
// rule trades that precision for a one-line check; authors who use two
// highlights per sentence can disable OFM123 or add an inline suppression.
const NESTED = /==[^=\n]*==[^=\n]*==/;

const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/;

interface FenceResult {
  readonly fence: string | null;
  readonly skip: boolean;
}

/**
 * Fence-tracking state machine shared with OFM041 and OFM122. Fenced
 * code blocks are skipped so example markdown inside rule documentation
 * does not trip the rule.
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
 * Strip inline backtick code so `===` operators inside prose don't count.
 * Mirrors the helper in OFM122.
 */
function stripInlineCode(line: string): string {
  return line.replace(/`[^`\n]*`/g, "");
}

/**
 * OFM123 — nested-highlight.
 *
 * Reports every line that contains three `==` marker pairs. The pattern
 * fires on both nested attempts (`==a ==b== c==`) and two separate
 * highlights on one line (`==a== and ==b==`); the latter is treated as a
 * style smell under the same rule. Teams that rely on multiple highlights
 * per line should disable the rule via `rules.OFM123.enabled: false`.
 *
 * @see docs/rules/highlights/OFM123.md
 */
export const OFM123Rule: OFMRule = {
  names: ["OFM123", "nested-highlight"],
  description: "Highlights cannot be nested",
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
      if (NESTED.test(scanned)) {
        onError({
          line: i + 1,
          column: 1,
          message: "Nested highlight detected",
        });
      }
    });
  },
};
