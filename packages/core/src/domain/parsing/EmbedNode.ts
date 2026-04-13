import type { SourcePosition } from "./SourcePosition.js";

/**
 * Obsidian file transclusion: `![[file]]`, `![[file|500]]`, `![[file|500x300]]`.
 * `width`/`height` hold the pipe-delimited sizing hint when present.
 */
export interface EmbedNode {
  readonly target: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly position: SourcePosition;
  readonly raw: string;
}

export function makeEmbedNode(fields: EmbedNode): EmbedNode {
  if (fields.target.length === 0) {
    throw new Error("EmbedNode.target must not be empty");
  }
  return Object.freeze({ ...fields });
}
