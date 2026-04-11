import { describe, it, expect } from "vitest";
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
});
