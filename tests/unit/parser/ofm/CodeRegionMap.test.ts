import { describe, it, expect } from "vitest";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

describe("CodeRegionMap", () => {
  it("marks fenced block lines as code", () => {
    const lines = [
      "text",
      "```",
      "inside",
      "```",
      "after",
    ];
    const map = buildCodeRegionMap(lines);
    expect(map.isInCode(1, 1)).toBe(false);
    expect(map.isInCode(2, 1)).toBe(true);
    expect(map.isInCode(3, 1)).toBe(true);
    expect(map.isInCode(4, 1)).toBe(true);
    expect(map.isInCode(5, 1)).toBe(false);
  });

  it("marks inline code spans", () => {
    const lines = ["hello `code here` world"];
    const map = buildCodeRegionMap(lines);
    expect(map.isInCode(1, 1)).toBe(false);
    expect(map.isInCode(1, 8)).toBe(true);
    expect(map.isInCode(1, 15)).toBe(true);
    expect(map.isInCode(1, 19)).toBe(false);
  });

  it("handles tilde fences", () => {
    const lines = ["~~~", "code", "~~~"];
    const map = buildCodeRegionMap(lines);
    expect(map.isInCode(2, 1)).toBe(true);
  });
});
