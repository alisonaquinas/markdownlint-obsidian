import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

/**
 * OFM025 — embed-size-on-non-image.
 *
 * Warns when an embed carries a `|WIDTH` or `|WIDTHxHEIGHT` sizing hint
 * but its target is not an image. Obsidian ignores the hint in that case,
 * so the author's intent is lost silently — a common source of confusion
 * when a PDF or video embed fails to shrink.
 *
 * Fixable: the autofix (Phase 10) will strip the redundant hint once precise
 * sizing-hint column tracking is available.
 *
 * @see docs/rules/embeds/OFM025.md
 */
export const OFM025Rule: OFMRule = {
  names: ["OFM025", "embed-size-on-non-image"],
  description: "Sizing hint used on an embed type that does not honour it",
  tags: ["embeds", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    for (const embed of parsed.embeds) {
      if (embed.width === null && embed.height === null) continue;
      const { kind } = classifyEmbed(embed);
      if (kind === "image") continue;
      onError({
        line: embed.position.line,
        column: embed.position.column,
        message: `Sizing hint ignored — ${kind} embeds do not honour width/height`,
      });
    }
  },
};
