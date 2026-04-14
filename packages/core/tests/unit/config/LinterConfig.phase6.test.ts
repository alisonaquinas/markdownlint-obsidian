/**
 * Unit tests for {@link LinterConfig} defaults — phase 6 (block references).
 *
 * @module tests/unit/config/LinterConfig.phase6.test
 */
import { describe, it, expect } from "bun:test";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";

describe("DEFAULT_CONFIG (phase 6)", () => {
  it("blockRefs defaults to Obsidian-compatible idPattern and unique ids", () => {
    expect(DEFAULT_CONFIG.blockRefs.idPattern).toBe("^[A-Za-z0-9-]{1,32}$");
    expect(DEFAULT_CONFIG.blockRefs.requireUnique).toBe(true);
  });

  it("highlights are allowed everywhere by default", () => {
    expect(DEFAULT_CONFIG.highlights.allow).toBe(true);
    expect(DEFAULT_CONFIG.highlights.allowedGlobs).toEqual([]);
  });

  it("comments are allowed and multiline is permitted by default", () => {
    expect(DEFAULT_CONFIG.comments.allow).toBe(true);
    expect(DEFAULT_CONFIG.comments.disallowMultiline).toBe(false);
  });

  it("OFM120 and OFM121 are disabled by default (opt-in via config)", () => {
    expect(DEFAULT_CONFIG.rules.OFM120?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM121?.enabled).toBe(false);
  });
});
