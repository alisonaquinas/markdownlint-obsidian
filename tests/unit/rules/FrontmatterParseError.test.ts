import { describe, it, expect } from "vitest";
import { frontmatterParseErrorRule } from "../../../src/infrastructure/rules/ofm/system/FrontmatterParseError.js";

describe("OFM902 frontmatter-parse-error", () => {
  it("has the correct names and severity", () => {
    expect(frontmatterParseErrorRule.names).toContain("OFM902");
    expect(frontmatterParseErrorRule.severity).toBe("error");
    expect(frontmatterParseErrorRule.fixable).toBe(false);
  });

  it("is registered via registerBuiltin", async () => {
    const { makeRuleRegistry } = await import("../../../src/domain/linting/RuleRegistry.js");
    const { registerBuiltinRules } =
      await import("../../../src/infrastructure/rules/ofm/registerBuiltin.js");
    const reg = makeRuleRegistry();
    registerBuiltinRules(reg);
    expect(reg.get("OFM902")).toBeDefined();
  });
});
