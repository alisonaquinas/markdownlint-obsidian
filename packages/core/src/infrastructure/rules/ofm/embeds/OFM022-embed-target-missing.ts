/**
 * Purpose: Detect non-markdown embed targets (images, PDFs, audio, video) that do not exist on the filesystem beneath the vault root.
 *
 * Provides: {@link OFM022Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM022 — asynchronously probes the filesystem for missing non-markdown embedded asset files.
 *
 * @module infrastructure/rules/ofm/embeds/OFM022-embed-target-missing
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

/**
 * OFM022 — embed-target-missing (non-markdown asset).
 *
 * Probes the real filesystem via {@link FileExistenceChecker} for every
 * non-markdown embed target. Markdown embeds are handled by OFM020 against
 * the in-memory VaultIndex; truly unknown extensions are ignored here and
 * left to OFM024 (`disallowed-embed-extension`).
 *
 * This is the first genuinely asynchronous rule in the codebase: `fsCheck`
 * returns a `Promise<boolean>`, so `run` is declared `async` and the
 * LintUseCase awaits its return value.
 *
 * When the vault index is `null` (resolve disabled) the rule is a no-op —
 * without `vault.root` there is nothing to probe against.
 *
 * @see docs/rules/embeds/OFM022.md
 */
export const OFM022Rule: OFMRule = {
  names: ["OFM022", "embed-target-missing"],
  description: "Embedded asset file does not exist beneath the vault root",
  tags: ["embeds", "assets"],
  severity: "error",
  fixable: false,
  async run({ parsed, vault, fsCheck }, onError) {
    if (vault === null) return;
    for (const embed of parsed.embeds) {
      const { kind } = classifyEmbed(embed);
      if (kind === "markdown" || kind === "unknown") continue;
      const exists = await fsCheck.exists(vault.root, embed.target);
      if (!exists) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed target "${embed.target}" not found beneath vault root`,
        });
      }
    }
  },
};
