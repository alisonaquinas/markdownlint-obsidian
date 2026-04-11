import { makeWikilinkNode, type WikilinkNode } from "../../../domain/parsing/WikilinkNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const WIKILINK_PATTERN = /(!?)\[\[([^\]\n]*?)\]\]/g;

interface ParsedParts {
  readonly target: string;
  readonly alias: string | null;
  readonly heading: string | null;
  readonly blockRef: string | null;
}

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
    collectFromLine(lines[i] ?? "", i + 1, codeMap, out);
  }
  return out;
}

function collectFromLine(
  line: string,
  lineNumber: number,
  codeMap: CodeRegionMap,
  out: WikilinkNode[],
): void {
  for (const match of line.matchAll(WIKILINK_PATTERN)) {
    const node = nodeFromMatch(match, lineNumber, codeMap);
    if (node !== null) out.push(node);
  }
}

function nodeFromMatch(
  match: RegExpMatchArray,
  lineNumber: number,
  codeMap: CodeRegionMap,
): WikilinkNode | null {
  const column = (match.index ?? 0) + 1;
  if (codeMap.isInCode(lineNumber, column)) return null;
  const inner = match[2] ?? "";
  if (inner.trim().length === 0) return null;
  const isEmbed = (match[1] ?? "") === "!";
  return buildNode(inner, isEmbed, lineNumber, column, match[0] ?? "");
}

function buildNode(
  inner: string,
  isEmbed: boolean,
  line: number,
  column: number,
  raw: string,
): WikilinkNode | null {
  const parts = splitParts(inner);
  if (parts.target.length === 0) return null;
  return makeWikilinkNode({
    target: parts.target,
    alias: parts.alias,
    heading: parts.heading,
    blockRef: parts.blockRef,
    position: makeSourcePosition(line, column),
    isEmbed,
    raw,
  });
}

function splitParts(inner: string): ParsedParts {
  const { head, alias } = splitAlias(inner);
  const { headBeforeCaret, blockRef } = splitBlockRef(head);
  const { target, heading } = splitHeading(headBeforeCaret);
  return { target, alias, heading, blockRef };
}

function splitAlias(inner: string): { head: string; alias: string | null } {
  const idx = inner.indexOf("|");
  if (idx === -1) return { head: inner, alias: null };
  const aliasText = inner.slice(idx + 1);
  return { head: inner.slice(0, idx), alias: aliasText.length > 0 ? aliasText : null };
}

function splitBlockRef(head: string): { headBeforeCaret: string; blockRef: string | null } {
  const idx = head.indexOf("^");
  if (idx === -1) return { headBeforeCaret: head, blockRef: null };
  const refText = head.slice(idx + 1);
  return {
    headBeforeCaret: head.slice(0, idx),
    blockRef: refText.length > 0 ? refText : null,
  };
}

function splitHeading(headBeforeCaret: string): { target: string; heading: string | null } {
  const idx = headBeforeCaret.indexOf("#");
  if (idx === -1) return { target: headBeforeCaret.trim(), heading: null };
  const headingText = headBeforeCaret.slice(idx + 1).trim();
  return {
    target: headBeforeCaret.slice(0, idx).trim(),
    heading: headingText.length > 0 ? headingText : null,
  };
}
