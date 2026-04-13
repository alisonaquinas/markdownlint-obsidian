import { describe, it, expect } from "bun:test";
import { validateConfig } from "../../../src/infrastructure/config/ConfigValidator.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";

describe("ConfigValidator", () => {
  it("accepts valid default config", () => {
    expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow();
  });

  it("throws OFM901 on unknown top-level key", () => {
    const bad = { ...DEFAULT_CONFIG, unknownKey: true } as unknown;
    expect(() => validateConfig(bad)).toThrow("OFM901");
  });

  it("accepts an `embeds` top-level key (Phase 5)", () => {
    const raw = { embeds: { allowedExtensions: ["png"] } } as unknown;
    expect(() => validateConfig(raw)).not.toThrow();
  });

  it("accepts Phase 6 `blockRefs`, `highlights`, `comments` keys", () => {
    const raw = {
      blockRefs: { idPattern: "^[a-z]+$", requireUnique: true },
      highlights: { allow: false, allowedGlobs: [] },
      comments: { allow: true, disallowMultiline: true },
    } as unknown;
    expect(() => validateConfig(raw)).not.toThrow();
  });
});
