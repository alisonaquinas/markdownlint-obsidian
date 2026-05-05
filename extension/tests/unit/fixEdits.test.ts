import { describe, expect, it } from "bun:test";
import { fixToTextEdit } from "../../src/fixes/fixEdits.js";

describe("fixToTextEdit", () => {
  it("converts core fix coordinates to editor edit data", () => {
    const edit = fixToTextEdit({
      lineNumber: 2,
      editColumn: 4,
      deleteCount: 1,
      insertText: "",
    });

    expect(edit.range.start).toEqual({ line: 1, character: 3 });
    expect(edit.range.end).toEqual({ line: 1, character: 4 });
  });
});
