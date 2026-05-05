/**
 * Converts core fix payloads into editor-neutral text edits.
 *
 * Core fixes use one-based line and column coordinates. The extension runtime
 * consumes the returned zero-based ranges to build VS Code workspace edits.
 *
 * @module fixes/fixEdits
 */

import type { Fix } from "markdownlint-obsidian/api";
import type { TextEditData, TextRange } from "../shared/types.js";

/**
 * Convert a markdownlint-obsidian fix into a zero-based text edit.
 *
 * @param fix - Core fix payload returned with a lint error.
 * @returns Editor-neutral text edit data.
 */
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
