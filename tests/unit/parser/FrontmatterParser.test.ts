import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../../../src/infrastructure/parser/FrontmatterParser.js";

describe("FrontmatterParser", () => {
  it("parses YAML frontmatter and returns body offset", () => {
    const src = "---\ntags: [project]\n---\n# Hello";
    const r = parseFrontmatter(src);
    expect(r.data).toEqual({ tags: ["project"] });
    expect(r.bodyStartLine).toBe(4);
    expect(r.rawFrontmatter).toBe("tags: [project]");
  });

  it("returns empty data for no frontmatter", () => {
    const r = parseFrontmatter("# Hello");
    expect(r.data).toEqual({});
    expect(r.bodyStartLine).toBe(1);
    expect(r.rawFrontmatter).toBeNull();
  });

  it("throws tagged OFM902 on malformed YAML", () => {
    expect(() => parseFrontmatter("---\n : invalid :\n---\nbody")).toThrowError(/OFM902/);
  });
});
