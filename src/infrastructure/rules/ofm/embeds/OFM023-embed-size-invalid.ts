import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

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
      if (maxWidth !== null && embed.width !== null && embed.width > maxWidth) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed width ${embed.width} exceeds maxWidth ${maxWidth}`,
        });
      }
      if (maxHeight !== null && embed.height !== null && embed.height > maxHeight) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed height ${embed.height} exceeds maxHeight ${maxHeight}`,
        });
      }
    }
  },
};
