/**
 * Purpose: Classify embed targets by kind and file extension.
 *
 * Provides: {@link classifyEmbed}, {@link EmbedKind}
 *
 * Role in system: Shared classifier for the embed rule family. Extension
 * extraction only considers the final path segment of the target after
 * stripping any URL scheme/host, query string, and fragment — dots in host
 * names or query parameters (map coordinates, base64 signatures) are not
 * extension separators.
 *
 * @module infrastructure/rules/ofm/embeds/shared/EmbedClassifier
 */
import type { EmbedNode } from "../../../../../domain/parsing/EmbedNode.js";

/** Coarse category of an embed target. */
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

const REMOTE_URL = /^[a-z]+:\/\//i;

function extensionOf(target: string): string {
  let path = REMOTE_URL.test(target)
    ? target.replace(/^[a-z]+:\/\/[^/#?]+/i, "")
    : target;
  path = path.split("?")[0]?.split("#")[0] ?? path;
  const segment = path.slice(path.lastIndexOf("/") + 1);
  const dotIdx = segment.lastIndexOf(".");
  if (dotIdx <= 0) {
    return "";
  }
  return segment.slice(dotIdx + 1).toLowerCase();
}

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
  const ext = extensionOf(embed.target);
  if (ext === "") {
    return { kind: "markdown", extension: "md" };
  }
  return { kind: BY_EXT[ext] ?? "unknown", extension: ext };
}
