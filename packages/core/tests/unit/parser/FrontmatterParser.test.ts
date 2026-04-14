/**
 * Unit tests for {@link parseFrontmatter}.
 *
 * @module tests/unit/parser/FrontmatterParser.test
 */
import { describe, it, expect } from "bun:test";
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

  it("throws OFM902 deterministically on repeated calls (no gray-matter cache fallthrough)", () => {
    // Regression: gray-matter cache was returning stale results without { cache: false }
    // Without it, gray-matter keyed its internal cache on the input string and returned
    // an empty-data success from the cache on the second call, silently swallowing OFM902.
    // Phase 6's BlockRefIndexBuilder triggered this by parsing every vault file before
    // the main lint pass.
    const malformed = "---\n : invalid :\n---\nbody";
    expect(() => parseFrontmatter(malformed)).toThrowError(/OFM902/);
    expect(() => parseFrontmatter(malformed)).toThrowError(/OFM902/);
    expect(() => parseFrontmatter(malformed)).toThrowError(/OFM902/);
  });
});
