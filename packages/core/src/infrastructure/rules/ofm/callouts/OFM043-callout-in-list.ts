/**
 * Purpose: Detect callouts that directly follow a list item without a blank line separator, causing incorrect rendering.
 *
 * Provides: {@link OFM043Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM043 — warns when a callout header immediately follows a list item, which causes Obsidian to render the callout as a list continuation.
 *
 * @module infrastructure/rules/ofm/callouts/OFM043-callout-in-list
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

// Matches bullet and ordered-list lines, with optional leading indentation.
const LIST_LINE = /^(\s*[-*+]\s|\s*\d+\.\s)/;

/**
 * OFM043 — callout-in-list.
 *
 * Warns when a callout directly follows a list item without a blank line
 * between them. Obsidian (and CommonMark in general) needs the blank line
 * to separate the block elements cleanly; otherwise the callout renders
 * as a continuation of the list item.
 *
 * The check looks one line back from the callout header — we do not try
 * to walk through indentation continuation lines, since that is exactly
 * the case we want to warn about.
 *
 * @see docs/rules/callouts/OFM043.md
 */
export const OFM043Rule: OFMRule = {
  names: ["OFM043", "callout-in-list"],
  description: "Callout directly follows a list item without a blank line",
  tags: ["callouts", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    for (const callout of parsed.callouts) {
      // Callout position is 1-based; the previous line is at index line-2.
      const prev = parsed.lines[callout.position.line - 2];
      if (prev !== undefined && LIST_LINE.test(prev)) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: "Callout immediately follows a list item; add a blank line before it",
        });
      }
    }
  },
};
