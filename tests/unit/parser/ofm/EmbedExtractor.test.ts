import { describe, it, expect } from "bun:test";
import { extractEmbeds } from "../../../../src/infrastructure/parser/ofm/EmbedExtractor.js";
import { extractWikilinks } from "../../../../src/infrastructure/parser/ofm/WikilinkExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string): ReturnType<typeof extractEmbeds> {
  const lines = src.split("\n");
  const map = buildCodeRegionMap(lines);
  return extractEmbeds(extractWikilinks(lines, map));
}

describe("EmbedExtractor", () => {
  it("filters embed wikilinks", () => {
    const out = run("![[image.png]]\n[[link]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("image.png");
  });

  it("parses |500x300 sizing hint", () => {
    const out = run("![[image.png|500x300]]");
    expect(out[0]?.width).toBe(500);
    expect(out[0]?.height).toBe(300);
  });

  it("parses |500 sizing hint as width only", () => {
    const out = run("![[image.png|500]]");
    expect(out[0]?.width).toBe(500);
    expect(out[0]?.height).toBeNull();
  });

  it("non-numeric alias becomes null dimensions", () => {
    const out = run("![[image.png|caption]]");
    expect(out[0]?.width).toBeNull();
    expect(out[0]?.height).toBeNull();
  });
});
