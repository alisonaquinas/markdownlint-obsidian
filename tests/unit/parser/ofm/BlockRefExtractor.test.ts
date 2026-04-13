import { describe, it, expect } from "bun:test";
import { extractBlockRefs } from "../../../../src/infrastructure/parser/ofm/BlockRefExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string): ReturnType<typeof extractBlockRefs> {
  const lines = src.split("\n");
  return extractBlockRefs(lines, buildCodeRegionMap(lines));
}

describe("BlockRefExtractor", () => {
  it("extracts trailing block reference", () => {
    const out = run("some paragraph content ^block-1");
    expect(out).toHaveLength(1);
    expect(out[0]?.blockId).toBe("block-1");
    expect(out[0]?.position.line).toBe(1);
  });

  it("skips block refs inside code fences", () => {
    const out = run("```\nline ^inside\n```");
    expect(out).toHaveLength(0);
  });

  it("ignores lines without trailing ^id", () => {
    const out = run("just a line");
    expect(out).toHaveLength(0);
  });
});
