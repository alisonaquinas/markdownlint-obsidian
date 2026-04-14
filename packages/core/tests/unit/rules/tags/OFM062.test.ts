/**
 * Unit tests for {@link OFM062Rule}.
 *
 * @module tests/unit/rules/tags/OFM062.test
 */
import { describe, it, expect } from "bun:test";
import { OFM062Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM062-empty-tag.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM062 empty-tag", () => {
  it("passes when no empty tag exists", async () => {
    const errors = await runRuleOnSource(OFM062Rule, "Body with #real tag.");
    expect(errors).toEqual([]);
  });

  it("fires on a lone hash surrounded by whitespace", async () => {
    const errors = await runRuleOnSource(OFM062Rule, "Body with # space");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM062");
    expect(errors[0]?.line).toBe(1);
  });

  it("fires on a lone '#/' token", async () => {
    const errors = await runRuleOnSource(OFM062Rule, "Body with #/ space");
    expect(errors).toHaveLength(1);
  });
});
