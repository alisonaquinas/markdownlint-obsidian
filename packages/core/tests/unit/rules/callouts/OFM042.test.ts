/**
 * Unit tests for {@link OFM042Rule}.
 *
 * @module tests/unit/rules/callouts/OFM042.test
 */
import { describe, it, expect } from "bun:test";
import { OFM042Rule } from "../../../../src/infrastructure/rules/ofm/callouts/OFM042-empty-callout.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

describe("OFM042 empty-callout", () => {
  it("passes for a callout with title and body", async () => {
    const errors = await runRuleOnSource(OFM042Rule, "> [!NOTE] Title\n> body\n");
    expect(errors).toEqual([]);
  });

  it("passes for a callout with title only", async () => {
    const errors = await runRuleOnSource(OFM042Rule, "> [!NOTE] Title\n");
    expect(errors).toEqual([]);
  });

  it("flags a callout with no title and no body", async () => {
    const errors = await runRuleOnSource(OFM042Rule, "> [!NOTE]\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM042");
  });

  it("flags a callout with empty title and whitespace-only body", async () => {
    const errors = await runRuleOnSource(OFM042Rule, "> [!NOTE]\n>   \n");
    expect(errors).toHaveLength(1);
  });

  it("flags title-less callout when requireTitle is true", async () => {
    const overrides = {
      callouts: { ...DEFAULT_CONFIG.callouts, requireTitle: true },
    };
    const errors = await runRuleOnSource(OFM042Rule, "> [!NOTE]\n> body\n", overrides);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("required");
  });
});
