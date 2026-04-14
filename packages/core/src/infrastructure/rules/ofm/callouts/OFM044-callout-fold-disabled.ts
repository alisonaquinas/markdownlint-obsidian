/**
 * Purpose: Detect foldable markers (`+`/`-`) on informational callout types when folding is disabled by configuration.
 *
 * Provides: {@link OFM044Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM044 — warns and provides an autofix when a NOTE/INFO/TIP/HINT callout carries a fold marker that `config.callouts.allowFold` prohibits.
 *
 * @module infrastructure/rules/ofm/callouts/OFM044-callout-fold-disabled
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import type { CalloutNode } from "../../../../domain/parsing/CalloutNode.js";
import { makeFix } from "../../../../domain/linting/Fix.js";

/**
 * Informational callout types on which a fold marker is usually pointless.
 * A `> [!NOTE]+` expands to exactly the same content every time, so the
 * fold handle is visual noise. Types in this set trigger OFM044 when
 * `config.callouts.allowFold` is `false`.
 */
const INFORMATIONAL = new Set(["NOTE", "INFO", "TIP", "HINT"]);

/**
 * OFM044 — callout-fold-disabled.
 *
 * Warns when an informational callout uses the `+`/`-` fold marker while
 * `config.callouts.allowFold` is `false`. The rule is a no-op when fold
 * is allowed (the config default), so style-agnostic projects never see
 * it. Marked `fixable` because the Phase 9 autofix can strip the marker.
 *
 * @see docs/rules/callouts/OFM044.md
 */
export const OFM044Rule: OFMRule = {
  names: ["OFM044", "callout-fold-disabled"],
  description: "Foldable marker used on an informational callout while fold is disabled",
  tags: ["callouts", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed, config }, onError) {
    if (config.callouts.allowFold) return;
    for (const callout of parsed.callouts) {
      if (callout.foldable === "none") continue;
      if (!INFORMATIONAL.has(callout.type)) continue;
      const headerLine = parsed.lines[callout.position.line - 1] ?? "";
      onError({
        line: callout.position.line,
        column: callout.position.column,
        message: `Informational callout "${callout.type}" should not be foldable`,
        fix: makeFix(buildFoldFix(callout, headerLine)),
      });
    }
  },
};

function buildFoldFix(
  callout: CalloutNode,
  headerLine: string,
): { lineNumber: number; editColumn: number; deleteCount: number; insertText: string } {
  const foldChar = callout.foldable === "open" ? "+" : "-";
  const foldIdx = headerLine.indexOf(foldChar);
  const editColumn = foldIdx >= 0 ? foldIdx + 1 : callout.position.column;
  return {
    lineNumber: callout.position.line,
    editColumn,
    deleteCount: 1,
    insertText: "",
  };
}
