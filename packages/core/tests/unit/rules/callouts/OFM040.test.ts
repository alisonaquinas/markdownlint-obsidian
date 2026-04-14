/**
 * Unit tests for {@link OFM040Rule}.
 *
 * @module tests/unit/rules/callouts/OFM040.test
 */
import { describe, it, expect } from "bun:test";
import { OFM040Rule } from "../../../../src/infrastructure/rules/ofm/callouts/OFM040-unknown-callout-type.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

const withAllowList = (list: readonly string[]): typeof DEFAULT_CONFIG =>
  ({
    ...DEFAULT_CONFIG,
    callouts: { ...DEFAULT_CONFIG.callouts, allowList: list },
  }) as typeof DEFAULT_CONFIG;

describe("OFM040 unknown-callout-type", () => {
  it("passes for a vanilla NOTE callout", async () => {
    const errors = await runRuleOnSource(OFM040Rule, "> [!NOTE] Title\n> body\n");
    expect(errors).toEqual([]);
  });

  it("flags a CUSTOM callout with the default allowList excluded", async () => {
    const overrides = withAllowList(["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"]);
    const errors = await runRuleOnSource(OFM040Rule, "> [!CUSTOM] Title\n> body\n", overrides);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM040");
    expect(errors[0]?.message).toContain("CUSTOM");
  });

  it("passes when CUSTOM is added to the allowList", async () => {
    const overrides = withAllowList(["NOTE", "WARNING", "CUSTOM"]);
    const errors = await runRuleOnSource(OFM040Rule, "> [!CUSTOM] Title\n> body\n", overrides);
    expect(errors).toEqual([]);
  });

  it("is case-insensitive by default (lower-case note)", async () => {
    const errors = await runRuleOnSource(OFM040Rule, "> [!note] Title\n> body\n");
    expect(errors).toEqual([]);
  });

  it("reports on the line the callout begins", async () => {
    const overrides = withAllowList(["NOTE"]);
    const src = "intro\n\n> [!CUSTOM] Title\n> body\n";
    const errors = await runRuleOnSource(OFM040Rule, src, overrides);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.line).toBe(3);
  });
});
