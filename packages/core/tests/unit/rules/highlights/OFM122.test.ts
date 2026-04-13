import { describe, it, expect } from "bun:test";
import { OFM122Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM122-malformed-highlight.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM122 malformed-highlight", () => {
  it("reports an odd number of `==` on a single line", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "unterminated ==highlight\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM122");
  });

  it("passes on a well-formed highlight", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "value ==one==\n");
    expect(errors).toEqual([]);
  });

  it("passes on two highlights", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "value ==one== and ==two==\n");
    expect(errors).toEqual([]);
  });

  it("ignores `==` markers inside fenced code", async () => {
    const src = "before\n```\nif (a === b) { }\n```\nafter\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("passes on a line without `==`", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "plain prose\n");
    expect(errors).toEqual([]);
  });
});
