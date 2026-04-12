import { describe, it, expect } from "vitest";
import { OFM124Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM124-empty-highlight.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM124 empty-highlight", () => {
  it("reports a whitespace-only highlight", async () => {
    const errors = await runRuleOnSource(OFM124Rule, "prose ==   ==\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM124");
    expect(errors[0]?.severity).toBe("warning");
    expect(errors[0]?.fixable).toBe(true);
  });

  it("passes on a highlight with content", async () => {
    const errors = await runRuleOnSource(OFM124Rule, "prose ==real text==\n");
    expect(errors).toEqual([]);
  });

  it("is a no-op when no highlights are present", async () => {
    const errors = await runRuleOnSource(OFM124Rule, "plain prose\n");
    expect(errors).toEqual([]);
  });
});
