import { describe, it, expect } from "bun:test";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";

describe("DEFAULT_CONFIG (phase 3)", () => {
  it("has default tags config", () => {
    expect(DEFAULT_CONFIG.tags.maxDepth).toBe(5);
    expect(DEFAULT_CONFIG.tags.caseSensitive).toBe(false);
    expect(DEFAULT_CONFIG.tags.allowList).toBeNull();
    expect(DEFAULT_CONFIG.tags.denyList).toEqual([]);
  });

  it("has frontmatter.required, dateFields, typeMap, and allowUnknown", () => {
    expect(DEFAULT_CONFIG.frontmatter.required).toEqual([]);
    expect(DEFAULT_CONFIG.frontmatter.dateFields).toEqual([]);
    expect(DEFAULT_CONFIG.frontmatter.typeMap).toEqual({});
    expect(DEFAULT_CONFIG.frontmatter.allowUnknown).toBe(true);
  });

  it("disables OFM062, OFM066 and OFM082 by default", () => {
    // OFM062 (empty-tag) is too noisy in raw prose to enable broadly;
    // OFM066 (frontmatter-tag-not-in-body) and OFM082 (unknown-top-level-key)
    // are both opt-in style rules.
    expect(DEFAULT_CONFIG.rules.OFM062?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM066?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM082?.enabled).toBe(false);
  });
});
