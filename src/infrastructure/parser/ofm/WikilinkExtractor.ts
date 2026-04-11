import { makeWikilinkNode, type WikilinkNode } from "../../../domain/parsing/WikilinkNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const WIKILINK_PATTERN = /(!?)\[\[([^\]\n]*?)\]\]/g;

/**
 * Extract every wikilink and embed from a Markdown file.
 * Skips any match whose opening `[[` falls inside a code region.
 * Empty targets are silently dropped — OFM002 detects `[[]]` separately.
 */
export function extractWikilinks(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly WikilinkNode[] {
  const out: WikilinkNode[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;
    for (const match of line.matchAll(WIKILINK_PATTERN)) {
      const column = (match.index ?? 0) + 1;
      if (codeMap.isInCode(lineNumber, column)) continue;
      const bang = match[1] ?? "";
      const inner = match[2] ?? "";
      if (inner.trim().length === 0) continue;
      const node = parseInner(inner, bang === "!", lineNumber, column, match[0] ?? "");
      if (node !== null) out.push(node);
    }
  }

  return out;
}

function parseInner(
  inner: string,
  isEmbed: boolean,
  line: number,
  column: number,
  raw: string,
): WikilinkNode | null {
  const pipeIdx = inner.indexOf("|");
  const head = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
  const alias = pipeIdx === -1 ? null : inner.slice(pipeIdx + 1) || null;

  const caretIdx = head.indexOf("^");
  const headBeforeCaret = caretIdx === -1 ? head : head.slice(0, caretIdx);
  const blockRef = caretIdx === -1 ? null : head.slice(caretIdx + 1) || null;

  const hashIdx = headBeforeCaret.indexOf("#");
  const target = (hashIdx === -1 ? headBeforeCaret : headBeforeCaret.slice(0, hashIdx)).trim();
  const heading = hashIdx === -1 ? null : headBeforeCaret.slice(hashIdx + 1).trim() || null;

  if (target.length === 0) return null;

  return makeWikilinkNode({
    target,
    alias,
    heading,
    blockRef,
    position: makeSourcePosition(line, column),
    isEmbed,
    raw,
  });
}
