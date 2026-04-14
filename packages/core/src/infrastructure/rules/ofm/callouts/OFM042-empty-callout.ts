/**
 * Purpose: Detect callouts that have no title and no body content, or (when configured) callouts that have a body but no title.
 *
 * Provides: {@link OFM042Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM042 — warns on empty callouts that render as blank colored boxes and optionally enforces title discipline.
 *
 * @module infrastructure/rules/ofm/callouts/OFM042-empty-callout
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM042 — empty-callout.
 *
 * Warns when a callout has no title and no body content. Such callouts
 * render as an empty colored box, which is almost always a mistake. When
 * `config.callouts.requireTitle` is enabled, this rule additionally flags
 * callouts that have a body but no title, so config-owners can enforce
 * a consistent headline discipline.
 *
 * @see docs/rules/callouts/OFM042.md
 */
export const OFM042Rule: OFMRule = {
  names: ["OFM042", "empty-callout"],
  description: "Callout has no title and no body",
  tags: ["callouts"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const callout of parsed.callouts) {
      const titleEmpty = callout.title.trim().length === 0;
      const bodyEmpty = callout.bodyLines.every((l) => l.trim().length === 0);
      if (titleEmpty && bodyEmpty) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: "Callout has no title and no body content",
        });
      } else if (titleEmpty && config.callouts.requireTitle) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: "Callout title is required by config",
        });
      }
    }
  },
};
