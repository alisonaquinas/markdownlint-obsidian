import { describe, it, expect } from "bun:test";
import { makeParseResult } from "../../../../src/domain/parsing/ParseResult.js";

describe("ParseResult", () => {
  it("freezes every array field", () => {
    const r = makeParseResult({
      filePath: "notes/index.md",
      frontmatter: { tags: ["project"] },
      frontmatterRaw: "tags: [project]",
      frontmatterEndLine: 3,
      tokens: [],
      wikilinks: [],
      embeds: [],
      callouts: [],
      tags: [],
      blockRefs: [],
      highlights: [],
      comments: [],
      raw: "# hi",
      lines: ["# hi"],
    });
    expect(Object.isFrozen(r.wikilinks)).toBe(true);
    expect(Object.isFrozen(r.lines)).toBe(true);
    expect(Object.isFrozen(r)).toBe(true);
  });

  it("rejects line count mismatch vs raw", () => {
    expect(() =>
      makeParseResult({
        filePath: "x.md",
        frontmatter: {},
        frontmatterRaw: null,
        frontmatterEndLine: 0,
        tokens: [],
        wikilinks: [],
        embeds: [],
        callouts: [],
        tags: [],
        blockRefs: [],
        highlights: [],
        comments: [],
        raw: "a\nb\nc",
        lines: ["a", "b"],
      }),
    ).toThrow(/line count/);
  });
});
