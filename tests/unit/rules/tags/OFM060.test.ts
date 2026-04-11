import { describe, it, expect } from "vitest";
import { OFM060Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM060-invalid-tag-format.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM060 invalid-tag-format", () => {
  it("passes for clean tags", async () => {
    const errors = await runRuleOnSource(OFM060Rule, "Body with #project and #area/notes tags.");
    expect(errors).toEqual([]);
  });

  it("fires on a double-slash tag", async () => {
    const errors = await runRuleOnSource(OFM060Rule, "Body #a//b text");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM060");
    expect(errors[0]?.message).toContain("a//b");
  });

  it("fires on a trailing-slash tag", async () => {
    const errors = await runRuleOnSource(OFM060Rule, "Body #area/ text");
    expect(errors).toHaveLength(1);
  });

  it("ignores tags inside fenced code blocks", async () => {
    const source = "```\n#a//b\n```\n";
    const errors = await runRuleOnSource(OFM060Rule, source);
    expect(errors).toEqual([]);
  });
});
