import type { SourcePosition } from "./SourcePosition.js";

/**
 * Obsidian admonition block: `> [!TYPE] Title` plus `> ` continuation lines.
 * `type` is stored uppercased; `title` is the trimmed text after the type tag.
 */
export interface CalloutNode {
  readonly type: string;
  readonly title: string;
  readonly position: SourcePosition;
  readonly bodyLines: readonly string[];
  readonly foldable: "none" | "open" | "closed";
}

export function makeCalloutNode(fields: CalloutNode): CalloutNode {
  if (fields.type.length === 0) {
    throw new Error("CalloutNode.type must not be empty");
  }
  return Object.freeze({
    ...fields,
    bodyLines: Object.freeze([...fields.bodyLines]) as readonly string[],
  });
}
