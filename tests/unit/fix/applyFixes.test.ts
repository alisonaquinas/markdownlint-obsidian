import { describe, it, expect } from "vitest";
import { makeFix } from "../../../src/domain/linting/Fix.js";
import { applyFixes } from "../../../src/domain/fix/applyFixes.js";

describe("applyFixes", () => {
  it("applies a single fix replacing a span on a single-line input", () => {
    // "hello world" → replace "world" (col 7, len 5) with "there"
    const raw = "hello world";
    const fix = makeFix({ lineNumber: 1, editColumn: 7, deleteCount: 5, insertText: "there" });

    const { patched, conflicts } = applyFixes(raw, [fix]);

    expect(patched).toBe("hello there");
    expect(conflicts).toHaveLength(0);
  });

  it("applies multiple non-overlapping fixes on the same line end-to-start", () => {
    // "abcdef" → replace col 5 len 1 ('e') with 'E', replace col 2 len 1 ('b') with 'B'
    // end-to-start order ensures earlier columns stay valid after later edits
    const raw = "abcdef";
    const fixA = makeFix({ lineNumber: 1, editColumn: 2, deleteCount: 1, insertText: "B" });
    const fixB = makeFix({ lineNumber: 1, editColumn: 5, deleteCount: 1, insertText: "E" });

    const { patched, conflicts } = applyFixes(raw, [fixA, fixB]);

    expect(patched).toBe("aBcdEf");
    expect(conflicts).toHaveLength(0);
  });

  it("detects overlap: first fix applied, second recorded as conflict", () => {
    // "abcdef" — fix1: col 2, delete 3 ("bcd"); fix2: col 3, delete 2 ("cd") — overlapping
    const raw = "abcdef";
    const fix1 = makeFix({ lineNumber: 1, editColumn: 2, deleteCount: 3, insertText: "X" });
    const fix2 = makeFix({ lineNumber: 1, editColumn: 3, deleteCount: 2, insertText: "Y" });

    const { patched: _patched, conflicts } = applyFixes(raw, [fix1, fix2], "test.md");

    // fix1 covers cols 2-4 (end-exclusive: 2+3=5), fix2 covers cols 3-4 (3+2=5) — they overlap
    // The one with higher editColumn is processed first in sorted order; fix2(col3) < fix1(col2)?
    // Sorted descending by editColumn: fix2(col3) then fix1(col2)
    // fix2 accepted first, then fix1 overlaps fix2 → fix1 in conflicts
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.filePath).toBe("test.md");
    expect(conflicts[0]!.reason).toContain("Overlap on line 1");
  });

  it("applies a fix on line 2 of a 3-line input without affecting other lines", () => {
    const raw = "line one\nline two\nline three";
    // Replace "two" on line 2 (col 6, len 3) with "TWO"
    const fix = makeFix({ lineNumber: 2, editColumn: 6, deleteCount: 3, insertText: "TWO" });

    const { patched, conflicts } = applyFixes(raw, [fix]);

    expect(patched).toBe("line one\nline TWO\nline three");
    expect(conflicts).toHaveLength(0);
  });

  it("performs a pure insertion (deleteCount: 0)", () => {
    const raw = "helloworld";
    // Insert a space at col 6 (between 'o' and 'w')
    const fix = makeFix({ lineNumber: 1, editColumn: 6, deleteCount: 0, insertText: " " });

    const { patched, conflicts } = applyFixes(raw, [fix]);

    expect(patched).toBe("hello world");
    expect(conflicts).toHaveLength(0);
  });

  it("performs a pure deletion (insertText: empty string)", () => {
    const raw = "hel lo";
    // Delete the space at col 4 (deleteCount 1, no insert)
    const fix = makeFix({ lineNumber: 1, editColumn: 4, deleteCount: 1, insertText: "" });

    const { patched, conflicts } = applyFixes(raw, [fix]);

    expect(patched).toBe("hello");
    expect(conflicts).toHaveLength(0);
  });

  it("returns raw content unchanged and no conflicts when fixes array is empty", () => {
    const raw = "nothing to fix here\nsecond line";

    const { patched, conflicts } = applyFixes(raw, []);

    expect(patched).toBe(raw);
    expect(conflicts).toHaveLength(0);
  });

  it("preserves CRLF line endings when splitting and rejoining", () => {
    // split on \n, each line may contain trailing \r — they should be preserved
    const raw = "line one\r\nline two\r\nline three";
    const fix = makeFix({ lineNumber: 2, editColumn: 6, deleteCount: 3, insertText: "TWO" });

    const { patched, conflicts } = applyFixes(raw, [fix]);

    // "line two\r" after split on \n — col 6 = 't', len 3 replaces "two" leaving "\r" intact
    expect(patched).toBe("line one\r\nline TWO\r\nline three");
    expect(conflicts).toHaveLength(0);
  });
});
