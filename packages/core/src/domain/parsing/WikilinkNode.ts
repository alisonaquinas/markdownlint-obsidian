import type { SourcePosition } from "./SourcePosition.js";

/**
 * A parsed wikilink: `[[target]]`, `[[target|alias]]`,
 * `[[target#heading]]`, `[[target#^blockref]]`, `![[embed]]`.
 * Immutable.
 */
export interface WikilinkNode {
  readonly target: string;
  readonly alias: string | null;
  readonly heading: string | null;
  readonly blockRef: string | null;
  readonly position: SourcePosition;
  readonly isEmbed: boolean;
  readonly raw: string;
}

export function makeWikilinkNode(fields: WikilinkNode): WikilinkNode {
  if (fields.target.length === 0) {
    throw new Error("WikilinkNode.target must not be empty");
  }
  return Object.freeze({ ...fields });
}
