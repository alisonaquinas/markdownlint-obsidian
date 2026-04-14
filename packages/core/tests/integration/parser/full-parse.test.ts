/**
 * Integration tests for the full Markdown parse pipeline.
 *
 * @module tests/integration/parser/full-parse.test
 */
import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";

const FIXTURES = fileURLToPath(new URL("../../fixtures/parser", import.meta.url));

describe("full parse integration", () => {
  const parser = makeMarkdownItParser();

  it("extracts every OFM node type from the fixture", async () => {
    const src = await readMarkdownFile(path.join(FIXTURES, "all-ofm-nodes.md"));
    const r = parser.parse("all-ofm-nodes.md", src);

    expect(r.frontmatter).toEqual(expect.objectContaining({ tags: ["fixture"] }));
    expect(r.wikilinks.length).toBeGreaterThanOrEqual(2);
    expect(r.embeds).toHaveLength(1);
    expect(r.tags.length).toBeGreaterThanOrEqual(2);
    expect(r.highlights).toHaveLength(1);
    expect(r.callouts).toHaveLength(1);
    expect(r.blockRefs).toHaveLength(1);
    expect(r.comments).toHaveLength(1);
  });

  it("clean fixture produces no OFM nodes", async () => {
    const src = await readMarkdownFile(path.join(FIXTURES, "clean.md"));
    const r = parser.parse("clean.md", src);
    expect(r.wikilinks).toHaveLength(0);
    expect(r.tags).toHaveLength(0);
  });

  it("broken fixture throws OFM902", async () => {
    const src = await readMarkdownFile(path.join(FIXTURES, "frontmatter-broken.md"));
    expect(() => parser.parse("frontmatter-broken.md", src)).toThrowError(/OFM902/);
  });
});
