import { makeCalloutNode, type CalloutNode } from "../../../domain/parsing/CalloutNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const HEADER_PATTERN = /^>\s*\[!([A-Za-z][A-Za-z0-9-]*)\]([+-]?)\s*(.*)$/;
const CONTINUATION_PATTERN = /^>\s?(.*)$/;

export function extractCallouts(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly CalloutNode[] {
  const out: CalloutNode[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    if (codeMap.isInCode(lineNumber, 1)) continue;
    const header = (lines[i] ?? "").match(HEADER_PATTERN);
    if (header === null) continue;

    const type = (header[1] ?? "").toUpperCase();
    const foldable: CalloutNode["foldable"] =
      header[2] === "+" ? "open" : header[2] === "-" ? "closed" : "none";
    const title = (header[3] ?? "").trim();

    const bodyLines: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const cont = (lines[j] ?? "").match(CONTINUATION_PATTERN);
      if (cont === null) break;
      bodyLines.push(cont[1] ?? "");
      j += 1;
    }

    out.push(
      makeCalloutNode({
        type,
        title,
        position: makeSourcePosition(lineNumber, 1),
        bodyLines,
        foldable,
      }),
    );
    i = j - 1;
  }

  return out;
}
