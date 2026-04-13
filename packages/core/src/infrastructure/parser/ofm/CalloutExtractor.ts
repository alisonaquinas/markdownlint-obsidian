import { makeCalloutNode, type CalloutNode } from "../../../domain/parsing/CalloutNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const HEADER_PATTERN = /^>\s*\[!([A-Za-z][A-Za-z0-9-]*)\]([+-]?)\s*(.*)$/;
const CONTINUATION_PATTERN = /^>\s?(.*)$/;

interface ParsedHeader {
  readonly type: string;
  readonly title: string;
  readonly foldable: CalloutNode["foldable"];
}

export function extractCallouts(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly CalloutNode[] {
  const out: CalloutNode[] = [];
  let i = 0;
  while (i < lines.length) {
    i = scanCalloutAt(lines, i, codeMap, out);
  }
  return out;
}

function scanCalloutAt(
  lines: readonly string[],
  index: number,
  codeMap: CodeRegionMap,
  out: CalloutNode[],
): number {
  const lineNumber = index + 1;
  if (codeMap.isInCode(lineNumber, 1)) return index + 1;
  const header = parseHeader(lines[index] ?? "");
  if (header === null) return index + 1;

  const { bodyLines, nextIndex } = collectBody(lines, index + 1);
  out.push(
    makeCalloutNode({
      type: header.type,
      title: header.title,
      position: makeSourcePosition(lineNumber, 1),
      bodyLines,
      foldable: header.foldable,
    }),
  );
  return nextIndex;
}

function parseHeader(line: string): ParsedHeader | null {
  const match = line.match(HEADER_PATTERN);
  if (match === null) return null;
  const type = (match[1] ?? "").toUpperCase();
  const marker = match[2];
  const foldable: CalloutNode["foldable"] =
    marker === "+" ? "open" : marker === "-" ? "closed" : "none";
  return { type, title: (match[3] ?? "").trim(), foldable };
}

function collectBody(
  lines: readonly string[],
  start: number,
): { bodyLines: string[]; nextIndex: number } {
  const bodyLines: string[] = [];
  let j = start;
  while (j < lines.length) {
    const cont = (lines[j] ?? "").match(CONTINUATION_PATTERN);
    if (cont === null) break;
    bodyLines.push(cont[1] ?? "");
    j += 1;
  }
  return { bodyLines, nextIndex: j };
}
