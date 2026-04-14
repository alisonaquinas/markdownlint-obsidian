/**
 * Purpose: Scans document lines for Obsidian `==highlighted text==` spans, skipping any that fall inside code regions.
 *
 * Provides: {@link extractHighlights}
 *
 * Role in system: One of the OFM-specific extractors that populates `ParseResult.highlights`,
 * enabling rules to detect, count, or reformat highlight syntax across the document without
 * re-parsing the source.
 *
 * @module infrastructure/parser/ofm/HighlightExtractor
 */
import { makeHighlightNode, type HighlightNode } from "../../../domain/parsing/HighlightNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const HIGHLIGHT_PATTERN = /==([^=\n]+)==/g;

export function extractHighlights(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly HighlightNode[] {
  const out: HighlightNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;
    for (const match of line.matchAll(HIGHLIGHT_PATTERN)) {
      const column = (match.index ?? 0) + 1;
      if (codeMap.isInCode(lineNumber, column)) continue;
      out.push(
        makeHighlightNode({
          text: match[1] ?? "",
          position: makeSourcePosition(lineNumber, column),
        }),
      );
    }
  }
  return out;
}
