import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

/**
 * OFM024 — disallowed-embed-extension.
 *
 * Reports embeds whose file extension is not in
 * `config.embeds.allowedExtensions`. Extensions are compared
 * case-insensitively so `![[photo.PNG]]` and `![[photo.png]]` share the
 * same decision.
 *
 * Unlike OFM020 (in-vault markdown resolution) and OFM022 (filesystem
 * asset probing), this rule needs neither the VaultIndex nor the
 * FileExistenceChecker — it is a pure syntactic policy check on the
 * embed target, so it runs cheaply and predictably.
 *
 * @see docs/rules/embeds/OFM024.md
 */
export const OFM024Rule: OFMRule = {
  names: ["OFM024", "disallowed-embed-extension"],
  description: "Embed extension is not in the allowedExtensions list",
  tags: ["embeds"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const allowed = new Set(config.embeds.allowedExtensions.map((e) => e.toLowerCase()));
    for (const embed of parsed.embeds) {
      const { extension } = classifyEmbed(embed);
      if (!allowed.has(extension)) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed extension ".${extension}" is not in allowedExtensions`,
        });
      }
    }
  },
};
