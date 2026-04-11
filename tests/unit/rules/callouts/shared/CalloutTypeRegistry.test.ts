import { describe, it, expect } from "vitest";
import { buildCalloutTypeRegistry } from "../../../../../src/infrastructure/rules/ofm/callouts/shared/CalloutTypeRegistry.js";
import type { CalloutConfig } from "../../../../../src/domain/config/LinterConfig.js";

const base: CalloutConfig = Object.freeze({
  allowList: Object.freeze(["NOTE", "WARNING"]),
  caseSensitive: false,
  requireTitle: false,
  allowFold: true,
});

describe("buildCalloutTypeRegistry", () => {
  it("matches case-insensitively by default", () => {
    const reg = buildCalloutTypeRegistry(base);
    expect(reg.has("NOTE")).toBe(true);
    expect(reg.has("note")).toBe(true);
    expect(reg.has("Warning")).toBe(true);
  });

  it("rejects types outside the allowList", () => {
    const reg = buildCalloutTypeRegistry(base);
    expect(reg.has("CUSTOM")).toBe(false);
  });

  it("respects case-sensitive mode", () => {
    const reg = buildCalloutTypeRegistry({ ...base, caseSensitive: true });
    expect(reg.has("NOTE")).toBe(true);
    expect(reg.has("note")).toBe(false);
  });

  it("handles an empty allowList", () => {
    const reg = buildCalloutTypeRegistry({ ...base, allowList: [] });
    expect(reg.has("NOTE")).toBe(false);
  });
});
