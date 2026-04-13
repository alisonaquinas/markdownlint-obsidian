import { describe, it, expect } from "bun:test";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";

describe("MarkdownItParser", () => {
  const parser = makeMarkdownItParser();

  it("returns frontmatter, lines, and raw", () => {
    const src = "---\ntags: [a]\n---\n# Hi\n[[page]]";
    const r = parser.parse("notes/index.md", src);
    expect(r.filePath).toBe("notes/index.md");
    expect(r.frontmatter).toEqual({ tags: ["a"] });
    expect(r.wikilinks).toHaveLength(1);
    expect(r.wikilinks[0]?.target).toBe("page");
    expect(r.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("collects every OFM node type", () => {
    const src = [
      "---",
      "tags: [x]",
      "---",
      "# Heading",
      "See [[other]].",
      "![[image.png|200]]",
      "Body text #tag1 and ==highlight==.",
      "",
      "> [!NOTE] Note",
      "> body",
      "",
      "End ^last",
      "",
      "Side %%todo%% note.",
    ].join("\n");
    const r = parser.parse("x.md", src);
    expect(r.wikilinks.length).toBeGreaterThanOrEqual(1);
    expect(r.embeds).toHaveLength(1);
    expect(r.tags).toHaveLength(1);
    expect(r.highlights).toHaveLength(1);
    expect(r.callouts).toHaveLength(1);
    expect(r.blockRefs).toHaveLength(1);
    expect(r.comments).toHaveLength(1);
    expect(r.tokens.length).toBeGreaterThan(0);
  });

  it("propagates OFM902 on broken frontmatter", () => {
    expect(() => parser.parse("x.md", "---\n : :\n---\nbody")).toThrowError(/OFM902/);
  });
});
