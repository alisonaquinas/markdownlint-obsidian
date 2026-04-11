import { makeEmbedNode, type EmbedNode } from "../../../domain/parsing/EmbedNode.js";
import type { WikilinkNode } from "../../../domain/parsing/WikilinkNode.js";

const SIZE_PATTERN = /^(\d+)(?:x(\d+))?$/;

export function extractEmbeds(wikilinks: readonly WikilinkNode[]): readonly EmbedNode[] {
  const out: EmbedNode[] = [];
  for (const wl of wikilinks) {
    if (!wl.isEmbed) continue;
    const { width, height } = parseSize(wl.alias);
    out.push(
      makeEmbedNode({
        target: wl.target,
        width,
        height,
        position: wl.position,
        raw: wl.raw,
      }),
    );
  }
  return out;
}

function parseSize(alias: string | null): { width: number | null; height: number | null } {
  if (alias === null) return { width: null, height: null };
  const match = alias.match(SIZE_PATTERN);
  if (match === null) return { width: null, height: null };
  return {
    width: Number.parseInt(match[1] ?? "0", 10),
    height: match[2] !== undefined ? Number.parseInt(match[2], 10) : null,
  };
}
