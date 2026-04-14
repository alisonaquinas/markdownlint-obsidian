/**
 * Unit tests for {@link extractWikilinks}.
 *
 * @module tests/unit/parser/ofm/WikilinkExtractor.test
 */
import { describe, it, expect } from "bun:test";
import { extractWikilinks } from "../../../../src/infrastructure/parser/ofm/WikilinkExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function extract(src: string): ReturnType<typeof extractWikilinks> {
  const lines = src.split("\n");
  return extractWikilinks(lines, buildCodeRegionMap(lines));
}

describe("WikilinkExtractor", () => {
  it("finds a plain wikilink", () => {
    const out = extract("see [[index]] for more");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("index");
    expect(out[0]?.isEmbed).toBe(false);
  });

  it("parses alias, heading, and block parts", () => {
    const out = extract("[[notes/project#intro^abc-123|display]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("notes/project");
    expect(out[0]?.heading).toBe("intro");
    expect(out[0]?.blockRef).toBe("abc-123");
    expect(out[0]?.alias).toBe("display");
  });

  it("marks embed links", () => {
    const out = extract("![[image.png]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.isEmbed).toBe(true);
  });

  it("skips wikilinks inside code fences", () => {
    const src = ["```", "[[ignored]]", "```", "[[real]]"].join("\n");
    const out = extract(src);
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("real");
  });

  it("skips wikilinks inside inline code", () => {
    const out = extract("`[[in-code]]` then [[outside]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("outside");
  });

  it("silently drops empty wikilinks — OFM002 handles [[]]", () => {
    const out = extract("[[]]");
    expect(out).toHaveLength(0);
  });
});
