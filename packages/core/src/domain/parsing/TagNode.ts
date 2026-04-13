import type { SourcePosition } from "./SourcePosition.js";

/**
 * Obsidian tag occurrence in body text: `#tag` or `#nested/tag`.
 * `value` excludes the leading `#`.
 */
export interface TagNode {
  readonly value: string;
  readonly position: SourcePosition;
  readonly raw: string;
}

export function makeTagNode(fields: TagNode): TagNode {
  if (fields.value.length === 0) {
    throw new Error("TagNode.value must not be empty");
  }
  if (fields.value.startsWith("#")) {
    throw new Error("TagNode.value must not include leading #");
  }
  return Object.freeze({ ...fields });
}
