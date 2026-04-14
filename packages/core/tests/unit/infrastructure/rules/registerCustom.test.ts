/**
 * Unit tests for {@link registerCustomRules}.
 *
 * @module tests/unit/infrastructure/rules/registerCustom.test
 */
import { describe, it, expect, vi, afterEach } from "bun:test";
import { registerCustomRules } from "../../../../src/infrastructure/rules/registerCustom.js";
import { makeRuleRegistry } from "../../../../src/domain/linting/RuleRegistry.js";
import type { OFMRule } from "../../../../src/domain/linting/OFMRule.js";

/** Minimal stub satisfying the OFMRule interface. */
function makeStubRule(names: string[]): OFMRule {
  return {
    names,
    description: "stub rule",
    tags: [],
    severity: "warning",
    fixable: false,
    run: () => undefined,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("registerCustomRules", () => {
  it("registers all rules when there are no name conflicts", () => {
    const registry = makeRuleRegistry();
    const ruleA = makeStubRule(["OFM101", "rule-a"]);
    const ruleB = makeStubRule(["OFM102", "rule-b"]);

    registerCustomRules(registry, [ruleA, ruleB]);

    expect(registry.all()).toHaveLength(2);
    expect(registry.get("OFM101")).toBe(ruleA);
    expect(registry.get("OFM102")).toBe(ruleB);
  });

  it("does not throw when a rule name clashes with an existing rule", () => {
    const registry = makeRuleRegistry();
    const original = makeStubRule(["OFM101"]);
    registry.register(original);

    const duplicate = makeStubRule(["OFM101"]);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => registerCustomRules(registry, [duplicate])).not.toThrow();
  });

  it("writes an OFM904 line to stderr labelling the colliding alias, not the rule's primary name", () => {
    const registry = makeRuleRegistry();
    // Register a rule under "OFM101".
    const original = makeStubRule(["OFM101"]);
    registry.register(original);

    // New rule whose *primary* name is unique but whose alias "OFM101" collides.
    const duplicate = makeStubRule(["MY-UNIQUE-CODE", "OFM101"]);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    registerCustomRules(registry, [duplicate]);

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const written = stderrSpy.mock.calls[0]?.[0] as string;
    expect(written).toMatch(/^OFM904:/);
    // The label must be the *colliding* name, not the rule's primary name.
    expect(written).toContain('"OFM101"');
    expect(written).not.toContain('"MY-UNIQUE-CODE"');
    // The registry throws "Duplicate rule name: OFM101" — verify it propagates.
    expect(written).toContain("Duplicate rule name: OFM101");
  });

  it("registers non-conflicting rules and skips only the duplicate", () => {
    const registry = makeRuleRegistry();
    const original = makeStubRule(["OFM101"]);
    registry.register(original);

    const good = makeStubRule(["OFM102"]);
    const duplicate = makeStubRule(["OFM101"]);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    registerCustomRules(registry, [good, duplicate]);

    expect(registry.get("OFM102")).toBe(good);
    expect(registry.all()).toHaveLength(2); // original + good
    expect(stderrSpy).toHaveBeenCalledTimes(1);
  });
});
