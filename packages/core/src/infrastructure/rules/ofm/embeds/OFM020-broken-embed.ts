/**
 * Purpose: Detect embed transclusions (`![[target]]`) whose markdown target does not exist in the vault.
 *
 * Provides: {@link OFM020Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM020 — flags broken markdown embed targets that cannot be resolved in the vault index.
 *
 * @module infrastructure/rules/ofm/embeds/OFM020-broken-embed
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

/**
 * OFM020 — broken-embed (markdown target).
 *
 * Emits an error when an `![[target]]` transclusion resolves to a markdown
 * file that does not exist in the vault. Non-markdown assets (images, PDFs,
 * audio, video) are handed off to OFM022 via {@link classifyEmbed}. When the
 * vault index is `null` (resolve disabled) this rule is a no-op, matching
 * the OFM001 convention.
 *
 * @see docs/rules/embeds/OFM020.md
 */
export const OFM020Rule: OFMRule = {
  names: ["OFM020", "broken-embed"],
  description: "Embed target is a markdown file that does not exist in the vault",
  tags: ["embeds"],
  severity: "error",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const embed of parsed.embeds) {
      const { kind } = classifyEmbed(embed);
      if (kind !== "markdown") continue;
      const match = vault.resolve({ target: embed.target });
      if (match.kind === "not-found") {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Broken embed: "${embed.target}" not found in vault`,
        });
      }
    }
  },
};
