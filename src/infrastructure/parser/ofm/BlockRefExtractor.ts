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
    const lineNumber = i + 1;
    if (codeMap.isInCode(lineNumber, 1)) continue;
    const match = (lines[i] ?? "").match(BLOCK_REF_PATTERN);
    if (match === null) continue;
    const id = match[1] ?? "";
    const column = ((match.index ?? 0) + (match[0]?.length ?? 0)) - id.length;
    out.push(
      makeBlockRefNode({
        blockId: id,
        position: makeSourcePosition(lineNumber, column),
      }),
    );
  }
  return out;
}
