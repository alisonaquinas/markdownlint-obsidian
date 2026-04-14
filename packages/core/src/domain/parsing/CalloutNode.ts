/**
 * Purpose: Defines the value object representing an Obsidian callout (admonition) block.
 *
 * Provides: {@link CalloutNode}, {@link makeCalloutNode}
 *
 * Role in system: One of the OFM-specific AST node types stored on {@link ParseResult.callouts}; consumed by callout rules (OFM040–OFM044) that validate type membership, title presence, and foldability against {@link CalloutConfig}.
 *
 * @module domain/parsing/CalloutNode
 */
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
