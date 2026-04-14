/**
 * Purpose: Extracts Obsidian `%% ... %%` comment regions, including multi-line spans, and maps them to typed domain nodes with precise source positions.
 *
 * Provides: {@link extractComments}
 *
 * Role in system: One of the OFM-specific extractors whose output populates
 * `ParseResult.comments`, giving rules visibility into comment boundaries without
 * needing to re-scan the raw source string.
 *
 * @module infrastructure/parser/ofm/CommentExtractor
 */
import { makeCommentNode, type CommentNode } from "../../../domain/parsing/CommentNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";

/**
 * Extract %% ... %% comment regions. Multi-line comments are supported by
 * concatenating the raw text with \n.
 */
export function extractComments(lines: readonly string[]): readonly CommentNode[] {
  const raw = lines.join("\n");
  const out: CommentNode[] = [];
  let i = 0;
  while (i < raw.length) {
    const start = raw.indexOf("%%", i);
    if (start === -1) break;
    const end = raw.indexOf("%%", start + 2);
    if (end === -1) break;

    const startPos = offsetToPosition(raw, start);
    const endPos = offsetToPosition(raw, end + 1);
    out.push(
      makeCommentNode({
        text: raw.slice(start + 2, end),
        position: makeSourcePosition(startPos.line, startPos.column),
        endPosition: makeSourcePosition(endPos.line, endPos.column),
      }),
    );
    i = end + 2;
  }
  return out;
}

function offsetToPosition(raw: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let k = 0; k < offset; k += 1) {
    if (raw.charAt(k) === "\n") {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, column: col };
}
