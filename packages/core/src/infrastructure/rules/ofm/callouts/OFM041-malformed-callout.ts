/**
 * Purpose: Detect lines that resemble a callout header but do not conform to Obsidian's callout grammar.
 *
 * Provides: {@link OFM041Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM041 — flags malformed callout headers (e.g. missing space, missing type) that the extractor cannot parse.
 *
 * @module infrastructure/rules/ofm/callouts/OFM041-malformed-callout
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { updateFence } from "../shared/fenceStateMachine.js";

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
