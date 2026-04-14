/**
 * Purpose: Classify embed nodes by their target file extension into coarse categories used by the OFM020-series rules.
 *
 * Provides: {@link classifyEmbed}, {@link EmbedKind}
 *
 * Role in system: Infrastructure-layer shared utility for OFM020–OFM025 — maps embed target extensions to a taxonomy (markdown, image, video, audio, pdf, unknown) so each rule can decide ownership.
 *
 * @module infrastructure/rules/ofm/embeds/shared/EmbedClassifier
 */
import type { EmbedNode } from "../../../../../domain/parsing/EmbedNode.js";

/**
 * Coarse taxonomy of embed target types. Used by the OFM020-series rules to
 * decide which rule owns a particular embed (OFM020 for markdown, OFM022 for
 * assets, OFM025 for sizing on non-images, etc.). Anything unrecognised by
 * the extension table is `"unknown"`.
 */
export type EmbedKind = "markdown" | "image" | "video" | "audio" | "pdf" | "unknown";

/**
 * Extension to {@link EmbedKind} lookup table. Keys are lowercase file
 * extensions without the dot. Kept as a frozen record so the whole module
 * stays side-effect-free.
 */
const BY_EXT: Readonly<Record<string, EmbedKind>> = Object.freeze({
  md: "markdown",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  mp4: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  pdf: "pdf",
});

/**
 * Classify an {@link EmbedNode} by its target's file extension.
 *
 * Extensionless targets are treated as markdown — matching Obsidian's
 * default behaviour where `![[note]]` transcludes `note.md`. Unrecognised
 * extensions return `"unknown"`; rule authors can then decide whether to
 * flag them (OFM024) or quietly skip (OFM020, OFM022).
 *
 * @param embed - The embed node to classify.
 * @returns `kind` (coarse category) and `extension` (lowercase, no dot).
 */
export function classifyEmbed(embed: EmbedNode): {
  readonly kind: EmbedKind;
  readonly extension: string;
} {
  const target = embed.target;
  const dotIdx = target.lastIndexOf(".");
  // A dot at position 0 (e.g. `.hidden`) is not a separator.
  if (dotIdx <= 0) {
    return { kind: "markdown", extension: "md" };
  }
  const ext = target.slice(dotIdx + 1).toLowerCase();
  return { kind: BY_EXT[ext] ?? "unknown", extension: ext };
}
