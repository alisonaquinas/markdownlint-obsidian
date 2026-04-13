import { describe, it, expect } from "bun:test";
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

  it("does not partially insert a rule when a later name collides", () => {
    const registry = makeRuleRegistry();
    // Seed the registry with a rule that owns the name "EXISTING"
    const existing: OFMRule = {
      names: ["EXISTING"],
      description: "already registered",
      tags: [],
      severity: "error",
      fixable: false,
      run: (): void => undefined,
    };
    registry.register(existing);

    // A new rule whose first name is fresh but whose second name collides
    const conflicting: OFMRule = {
      names: ["NEW-CODE", "EXISTING"],
      description: "should not be inserted",
      tags: [],
      severity: "error",
      fixable: false,
      run: (): void => undefined,
    };
    expect(() => registry.register(conflicting)).toThrow("EXISTING");

    // "NEW-CODE" must NOT be accessible after the failed registration
    expect(registry.get("NEW-CODE")).toBeUndefined();
    // Also confirm the overall registry size is unchanged after the failed insert
    expect(registry.all()).toHaveLength(1); // only the original "EXISTING" rule
  });
});
