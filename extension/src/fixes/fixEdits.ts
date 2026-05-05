import type { Fix } from "markdownlint-obsidian/api";
import type { TextEditData, TextRange } from "../shared/types.js";

export function fixToTextEdit(fix: Fix): TextEditData {
  return {
    range: fixRange(fix),
    newText: fix.insertText,
  };
}

function fixRange(fix: Fix): TextRange {
  const line = Math.max(0, fix.lineNumber - 1);
  const character = Math.max(0, fix.editColumn - 1);
  return {
    start: { line, character },
    end: { line, character: character + fix.deleteCount },
  };
}
