/**
 * Purpose: Defines the value object representing a parsed Obsidian wikilink, including optional alias, heading, and block-ref fragments.
 *
 * Provides: {@link WikilinkNode}, {@link makeWikilinkNode}
 *
 * Role in system: One of the OFM-specific AST node types stored on {@link ParseResult.wikilinks}; the primary input to wikilink resolution rules (OFM001–OFM010) that use {@link VaultIndex} to verify link targets.
 *
 * @module domain/parsing/WikilinkNode
 */
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
