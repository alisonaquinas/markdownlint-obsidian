/**
 * Purpose: Defines the value object representing a `==highlighted==` text span.
 *
 * Provides: {@link HighlightNode}, {@link makeHighlightNode}
 *
 * Role in system: One of the OFM-specific AST node types stored on {@link ParseResult.highlights}; consumed by highlight rules (OFM120–OFM124) that enforce the allow/deny policy and glob-based scoping defined in {@link HighlightConfig}.
 *
 * @module domain/parsing/HighlightNode
 */
import type { SourcePosition } from "./SourcePosition.js";

/** A `==highlighted==` span. `text` excludes the delimiters. */
export interface HighlightNode {
  readonly text: string;
  readonly position: SourcePosition;
}

export function makeHighlightNode(fields: HighlightNode): HighlightNode {
  return Object.freeze({ ...fields });
}
