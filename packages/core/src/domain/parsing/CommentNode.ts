/**
 * Purpose: Defines the value object representing an Obsidian comment span (`%%text%%`), which may be single- or multi-line.
 *
 * Provides: {@link CommentNode}, {@link makeCommentNode}
 *
 * Role in system: One of the OFM-specific AST node types stored on {@link ParseResult.comments}; consumed by comment rules (OFM121) that gate whether comments are allowed and whether multi-line variants are permitted per {@link CommentConfig}.
 *
 * @module domain/parsing/CommentNode
 */
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
