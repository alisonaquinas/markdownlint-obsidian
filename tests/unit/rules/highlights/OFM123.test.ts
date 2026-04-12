import { describe, it, expect } from "vitest";
import { OFM123Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM123-nested-highlight.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM123 nested-highlight", () => {
  it("reports three `==` markers on a single line", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==a ==b== c==\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM123");
  });

  it("also flags two adjacent highlights on one line (known trade-off)", async () => {
    // The regex cannot tell "nested" from "two highlights per line". The
    // rule documents this as a style-smell catch-all and recommends
    // disabling the rule or splitting lines if a vault uses this pattern.
    const errors = await runRuleOnSource(OFM123Rule, "==a== and ==b==\n");
    expect(errors).toHaveLength(1);
  });

  it("passes on a single highlight", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==one==\n");
    expect(errors).toEqual([]);
  });

  it("passes on plain prose", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "no highlights here\n");
    expect(errors).toEqual([]);
  });
});
