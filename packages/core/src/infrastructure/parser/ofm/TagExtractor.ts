/**
 * Purpose: Extracts Obsidian inline tags (`#tag`, `#nested/tag`) from document lines, skipping code regions and pure-numeric tokens.
 *
 * Provides: {@link extractTags}
 *
 * Role in system: One of the OFM-specific extractors that populates `ParseResult.tags`,
 * providing rules with a pre-built list of tag nodes so they can validate or normalise
 * tagging conventions without re-scanning the source.
 *
 * @module infrastructure/parser/ofm/TagExtractor
 */
import { makeTagNode, type TagNode } from "../../../domain/parsing/TagNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const TAG_PATTERN = /(?<![A-Za-z0-9_])#([A-Za-z0-9_/-]+)/g;
const HAS_LETTER = /[A-Za-z_-]/;

export function extractTags(lines: readonly string[], codeMap: CodeRegionMap): readonly TagNode[] {
  const out: TagNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    collectFromLine(lines[i] ?? "", i + 1, codeMap, out);
  }
  return out;
}

function collectFromLine(
  line: string,
  lineNumber: number,
  codeMap: CodeRegionMap,
  out: TagNode[],
): void {
  for (const match of line.matchAll(TAG_PATTERN)) {
    const column = (match.index ?? 0) + 1;
    if (codeMap.isInCode(lineNumber, column)) continue;
    const value = match[1] ?? "";
    if (!HAS_LETTER.test(value)) continue;
    out.push(
      makeTagNode({
        value,
        position: makeSourcePosition(lineNumber, column),
        raw: match[0] ?? "",
      }),
    );
  }
}
