import type { SourcePosition } from "./SourcePosition.js";

/** An Obsidian comment region `%%text%%`. May span multiple lines. */
export interface CommentNode {
  readonly text: string;
  readonly position: SourcePosition;
  readonly endPosition: SourcePosition;
}

export function makeCommentNode(fields: CommentNode): CommentNode {
  return Object.freeze({ ...fields });
}
