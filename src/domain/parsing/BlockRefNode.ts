import type { SourcePosition } from "./SourcePosition.js";

/**
 * An anchor block reference definition on a line: `Some content ^blockid`.
 * Obsidian allows one per line at the end of a block.
 */
export interface BlockRefNode {
  readonly blockId: string;
  readonly position: SourcePosition;
}

const BLOCK_ID_PATTERN = /^[A-Za-z0-9-]+$/;

export function makeBlockRefNode(fields: BlockRefNode): BlockRefNode {
  if (!BLOCK_ID_PATTERN.test(fields.blockId)) {
    throw new Error(`BlockRefNode.blockId invalid: ${fields.blockId}`);
  }
  return Object.freeze({ ...fields });
}
