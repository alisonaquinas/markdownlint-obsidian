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

  it("degrades gracefully when a standard rule crashes: retries without it and reports the skip", () => {
    // Upstream markdownlint's MD023 throws on tab-indented headings inside
    // list continuations ("Value of 'range' passed to onError ... is
    // incorrect"). One throwing rule must not kill the whole MD pass —
    // the adapter retries with that rule disabled and surfaces a
    // synthetic skip violation.
    const adapter = makeMarkdownLintAdapter();
    const content = "- item one\n\t## Heading inside item\ntrailing   \n";
    const results = adapter.runOnce("crash.md", content, { default: true, MD023: true });
    expect(Array.isArray(results)).toBe(true);
    const skip = results.find((r) => r.ruleNames.includes("MD023") && r.errorDetail?.includes("skipped"));
    expect(skip).toBeDefined();
    expect(skip?.lineNumber).toBe(1);
    // Other rules still ran on the file (MD009 sees the trailing spaces).
    const md009 = results.find((r) => r.ruleNames.includes("MD009"));
    expect(md009).toBeDefined();
    expect(md009?.lineNumber).toBe(3);
  });
});
