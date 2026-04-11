import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

// A line that looks like it is trying to be a callout header: starts with
// `>` followed by any whitespace and then `[`. This is a loose sniff so
// we only descend to the strict check when there is a plausible candidate.
const LOOKS_LIKE_HEADER = /^>\s*\[/;

// The same grammar the CalloutExtractor uses. A line that matches this is
// a well-formed callout header (possibly with a fold marker and title).
const STRICT_HEADER = /^>\s*\[!([A-Za-z][A-Za-z0-9-]*)\][+-]?(\s.*)?$/;

// Opening or closing fence line (```, ~~~, or longer).
const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/;

/**
 * Result of advancing the fence state machine over a single line.
 * `skip` means the line is either a fence delimiter or inside a code
 * block and should be ignored by the header check.
 */
interface FenceResult {
  readonly fence: string | null;
  readonly skip: boolean;
}

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
 * OFM041 — malformed-callout.
 *
 * Catches lines that look like they are trying to open a callout but do
 * not conform to the grammar used by Obsidian (and by our extractor).
 * Examples include `> [!NOTE]Title` (missing space after `]`),
 * `> [!] Title` (missing type), and `> [ NOTE ] Title` (stray spaces).
 * Well-formed callouts are silently skipped; lines that don't look like
 * headers at all (regular quote blocks) are also skipped. Fenced code
 * blocks are tracked and skipped so example markdown inside
 * documentation doesn't trip the rule.
 */
export const OFM041Rule: OFMRule = {
  names: ["OFM041", "malformed-callout"],
  description: "Line looks like a callout header but does not parse",
  tags: ["callouts", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    let fence: string | null = null;
    parsed.lines.forEach((line, i) => {
      const step = updateFence(line, fence);
      fence = step.fence;
      if (step.skip) return;
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
