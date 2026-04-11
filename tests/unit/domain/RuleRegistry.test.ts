import { describe, it, expect } from "vitest";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import type { OFMRule } from "../../../src/domain/linting/OFMRule.js";

const stubRule: OFMRule = {
  names: ["OFM001", "no-broken-wikilinks"],
  description: "Broken wikilink",
  tags: ["wikilinks"],
  severity: "error",
  fixable: false,
  run: (): void => undefined,
};

describe("RuleRegistry", () => {
  it("registers and retrieves a rule by code", () => {
    const registry = makeRuleRegistry();
    registry.register(stubRule);
    expect(registry.get("OFM001")).toBe(stubRule);
    expect(registry.get("no-broken-wikilinks")).toBe(stubRule);
  });

  it("throws on duplicate code", () => {
    const registry = makeRuleRegistry();
    registry.register(stubRule);
    expect(() => registry.register(stubRule)).toThrow(/duplicate/i);
  });

  it("all() returns registered rules", () => {
    const registry = makeRuleRegistry();
    registry.register(stubRule);
    expect(registry.all()).toHaveLength(1);
  });
});
