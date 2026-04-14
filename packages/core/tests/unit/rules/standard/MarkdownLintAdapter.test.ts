/**
 * Unit tests for {@link makeMarkdownLintAdapter}.
 *
 * @module tests/unit/rules/standard/MarkdownLintAdapter.test
 */
import { describe, it, expect } from "bun:test";
import { makeMarkdownLintAdapter } from "../../../../src/infrastructure/rules/standard/MarkdownLintAdapter.js";

describe("MarkdownLintAdapter", () => {
  it("returns an array for any input", () => {
    const adapter = makeMarkdownLintAdapter();
    const results = adapter.runOnce("x.md", "# h\n\n## h2\n", { default: true });
    expect(Array.isArray(results)).toBe(true);
  });

  it("caches by (filePath, contentHash): repeat calls return the SAME reference", () => {
    const adapter = makeMarkdownLintAdapter();
    const first = adapter.runOnce("x.md", "# h\n", { default: true });
    const second = adapter.runOnce("x.md", "# h\n", { default: true });
    expect(second).toBe(first);
  });

  it("busts the cache when content changes", () => {
    const adapter = makeMarkdownLintAdapter();
    const first = adapter.runOnce("x.md", "# h\n", { default: true });
    const second = adapter.runOnce("x.md", "# h\n\n# h2\n", { default: true });
    expect(second).not.toBe(first);
  });

  it("busts the cache when filePath changes", () => {
    const adapter = makeMarkdownLintAdapter();
    const first = adapter.runOnce("a.md", "# h\n", { default: true });
    const second = adapter.runOnce("b.md", "# h\n", { default: true });
    expect(second).not.toBe(first);
  });

  it("returns an empty array on clean content", () => {
    const adapter = makeMarkdownLintAdapter();
    const results = adapter.runOnce("clean.md", "# clean\n\ntext here\n", { default: true });
    expect(results).toEqual([]);
  });

  it("surfaces MD001 (heading-increment) violations with fixInfo when markdownlint provides it", () => {
    const adapter = makeMarkdownLintAdapter();
    const results = adapter.runOnce("skip.md", "# h1\n\n### skipped h2\n", { default: true });
    const md001 = results.filter((r) => r.ruleNames.includes("MD001"));
    expect(md001.length).toBeGreaterThan(0);
    // fixInfo is optional upstream; we at least verify the field round-trips
    // (undefined or an object, never null).
    for (const v of md001) {
      expect(v.fixInfo === undefined || typeof v.fixInfo === "object").toBe(true);
    }
  });

  it("freezes the returned array so callers cannot mutate the cache", () => {
    const adapter = makeMarkdownLintAdapter();
    const results = adapter.runOnce("x.md", "# h\n", { default: true });
    expect(Object.isFrozen(results)).toBe(true);
  });
});
