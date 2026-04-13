import { describe, it, expect } from "bun:test";
import { extractHighlights } from "../../../../src/infrastructure/parser/ofm/HighlightExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string): ReturnType<typeof extractHighlights> {
  const lines = src.split("\n");
  return extractHighlights(lines, buildCodeRegionMap(lines));
}

describe("HighlightExtractor", () => {
  it("extracts ==highlighted== span", () => {
    const out = run("plain ==important== text");
    expect(out).toHaveLength(1);
    expect(out[0]?.text).toBe("important");
  });

  it("skips highlights inside code fences", () => {
    const out = run("```\n==ignored==\n```");
    expect(out).toHaveLength(0);
  });
});
