/**
 * Purpose: Detect embed sizing hints that exceed the configured maximum width or height caps.
 *
 * Provides: {@link OFM023Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM023 — warns when an embed's width or height hint exceeds `config.embeds.maxWidth` or `maxHeight`.
 *
 * @module infrastructure/rules/ofm/embeds/OFM023-embed-size-invalid
 */
import type { OFMRule, OnErrorCallback } from "../../../../domain/linting/OFMRule.js";
import type { EmbedNode } from "../../../../domain/parsing/EmbedNode.js";

function checkAxis(
  embed: EmbedNode,
  actual: number | null,
  cap: number | null,
  axis: "width" | "height",
  onError: OnErrorCallback,
): void {
  if (cap === null || actual === null || actual <= cap) return;
  onError({
    line: embed.position.line,
    column: embed.position.column,
    message: `Embed ${axis} ${actual} exceeds max${axis[0]!.toUpperCase()}${axis.slice(1)} ${cap}`,
  });
}

/**
 * OFM023 — embed-size-invalid.
 *
 * Warns when an embed's width or height sizing hint exceeds the caps
 * configured in `config.embeds.maxWidth` / `maxHeight`. Both caps are
 * `null` by default so the rule is silent unless a project explicitly
 * opts in. Width and height are evaluated independently — a single
 * embed may fire twice if both axes exceed their cap.
 *
 * @see docs/rules/embeds/OFM023.md
 */
export const OFM023Rule: OFMRule = {
  names: ["OFM023", "embed-size-invalid"],
  description: "Embed sizing hint exceeds configured limits",
  tags: ["embeds"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    const { maxWidth, maxHeight } = config.embeds;
    if (maxWidth === null && maxHeight === null) return;
    for (const embed of parsed.embeds) {
      checkAxis(embed, embed.width, maxWidth, "width", onError);
      checkAxis(embed, embed.height, maxHeight, "height", onError);
    }
  },
};
