import type { SourcePosition } from "./SourcePosition.js";

/** A `==highlighted==` span. `text` excludes the delimiters. */
export interface HighlightNode {
  readonly text: string;
  readonly position: SourcePosition;
}

export function makeHighlightNode(fields: HighlightNode): HighlightNode {
  return Object.freeze({ ...fields });
}
