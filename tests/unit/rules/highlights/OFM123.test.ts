import { describe, it, expect } from "vitest";
import { OFM123Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM123-nested-highlight.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM123 nested-highlight", () => {
  it("reports a truly nested highlight (inner == inside outer span)", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==outer ==inner== text==\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM123");
  });

  it("reports three `==` markers where first span content ends with space", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==a ==b== c==\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM123");
  });

  it("does NOT flag two adjacent highlights on one line", async () => {
    // Two separate, non-overlapping highlights — each forms a valid span.
    const errors = await runRuleOnSource(OFM123Rule, "==a== and ==b==\n");
    expect(errors).toEqual([]);
  });

  it("does NOT flag adjacent highlights with no text between", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==foo== ==bar==\n");
    expect(errors).toEqual([]);
  });

  it("does NOT flag a multi-word highlight", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==multi word== and ==other==\n");
    expect(errors).toEqual([]);
  });

  it("passes on a single highlight", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "==one==\n");
    expect(errors).toEqual([]);
  });

  it("passes on plain prose", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "no highlights here\n");
    expect(errors).toEqual([]);
  });

  it("passes on inline code containing ==", async () => {
    const errors = await runRuleOnSource(OFM123Rule, "Use `a == b` for comparison\n");
    expect(errors).toEqual([]);
  });
});
