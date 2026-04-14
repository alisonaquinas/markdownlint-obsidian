/**
 * Unit tests for {@link LinterConfig} defaults — phase 5 (callouts).
 *
 * @module tests/unit/config/LinterConfig.phase5.test
 */
import { describe, it, expect } from "bun:test";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";

describe("DEFAULT_CONFIG (phase 5)", () => {
  it("has default callout allowList with Obsidian-vanilla types", () => {
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("NOTE");
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("WARNING");
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("TIP");
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("IMPORTANT");
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("CAUTION");
    // Obsidian-vanilla extended types
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("INFO");
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("ABSTRACT");
    expect(DEFAULT_CONFIG.callouts.allowList).toContain("QUOTE");
  });

  it("callouts default to case-insensitive, no required title, fold allowed", () => {
    expect(DEFAULT_CONFIG.callouts.caseSensitive).toBe(false);
    expect(DEFAULT_CONFIG.callouts.requireTitle).toBe(false);
    expect(DEFAULT_CONFIG.callouts.allowFold).toBe(true);
  });

  it("embeds has allowedExtensions covering images, audio, video, pdf, md", () => {
    expect(DEFAULT_CONFIG.embeds.allowedExtensions).toContain("md");
    expect(DEFAULT_CONFIG.embeds.allowedExtensions).toContain("png");
    expect(DEFAULT_CONFIG.embeds.allowedExtensions).toContain("jpg");
    expect(DEFAULT_CONFIG.embeds.allowedExtensions).toContain("pdf");
    expect(DEFAULT_CONFIG.embeds.allowedExtensions).toContain("mp4");
    expect(DEFAULT_CONFIG.embeds.allowedExtensions).toContain("mp3");
  });

  it("embeds has null size caps and remote disallowed by default", () => {
    expect(DEFAULT_CONFIG.embeds.maxWidth).toBeNull();
    expect(DEFAULT_CONFIG.embeds.maxHeight).toBeNull();
    expect(DEFAULT_CONFIG.embeds.allowRemote).toBe(false);
  });
});
