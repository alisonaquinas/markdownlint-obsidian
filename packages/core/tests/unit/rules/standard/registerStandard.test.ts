/**
 * Unit tests for {@link registerStandardRules}.
 *
 * @module tests/unit/rules/standard/registerStandard.test
 */
import { describe, it, expect } from "bun:test";
import { makeRuleRegistry } from "../../../../src/domain/linting/RuleRegistry.js";
import {
  registerStandardRules,
  STANDARD_RULE_DESCRIPTORS,
} from "../../../../src/infrastructure/rules/standard/registerStandard.js";

describe("registerStandardRules", () => {
  it("registers every descriptor in the STANDARD_RULE_DESCRIPTORS table", () => {
    const registry = makeRuleRegistry();
    registerStandardRules(registry);

    for (const desc of STANDARD_RULE_DESCRIPTORS) {
      const byCode = registry.get(desc.code);
      const byName = registry.get(desc.name);
      expect(byCode).toBeDefined();
      expect(byName).toBe(byCode);
    }
  });

  it("exposes at least 43 distinct MD rules (MD001..MD049 minus the retired codes)", () => {
    const registry = makeRuleRegistry();
    registerStandardRules(registry);
    const all = registry.all();
    const mdRules = all.filter((r) => r.names[0]?.startsWith("MD"));
    expect(mdRules.length).toBeGreaterThanOrEqual(43);
  });

  it("does not overlap OFM identifiers in the registry", () => {
    const registry = makeRuleRegistry();
    registerStandardRules(registry);
    expect(registry.get("OFM001")).toBeUndefined();
  });

  it("tags every registered rule with 'markdownlint' and 'standard'", () => {
    const registry = makeRuleRegistry();
    registerStandardRules(registry);
    for (const rule of registry.all()) {
      expect(rule.tags).toContain("markdownlint");
      expect(rule.tags).toContain("standard");
    }
  });

  it("keeps the descriptor table frozen so downstream code cannot mutate it", () => {
    expect(Object.isFrozen(STANDARD_RULE_DESCRIPTORS)).toBe(true);
  });
});
