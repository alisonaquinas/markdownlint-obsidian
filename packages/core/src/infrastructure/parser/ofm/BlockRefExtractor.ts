import { makeBlockRefNode, type BlockRefNode } from "../../../domain/parsing/BlockRefNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const BLOCK_REF_PATTERN = /(?:^|\s)\^([A-Za-z0-9-]+)\s*$/;

export function extractBlockRefs(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly BlockRefNode[] {
  const out: BlockRefNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const node = parseLine(lines[i] ?? "", i + 1, codeMap);
    if (node !== null) out.push(node);
  }
  return out;
}

function parseLine(line: string, lineNumber: number, codeMap: CodeRegionMap): BlockRefNode | null {
  if (codeMap.isInCode(lineNumber, 1)) return null;
  const match = line.match(BLOCK_REF_PATTERN);
  if (match === null) return null;
  const id = match[1] ?? "";
  const matchText = match[0] ?? "";
  const column = (match.index ?? 0) + matchText.length - id.length;
  return makeBlockRefNode({
    blockId: id,
    position: makeSourcePosition(lineNumber, column),
  });
}
