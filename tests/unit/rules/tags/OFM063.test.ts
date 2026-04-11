import { describe, it, expect } from "vitest";
import { OFM063Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM063-trailing-slash.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM063 tag-trailing-slash", () => {
  it("passes for clean tags", async () => {
    const errors = await runRuleOnSource(OFM063Rule, "Body #area/notes here.");
    expect(errors).toEqual([]);
  });

  it("fires on a tag ending with '/'", async () => {
    const errors = await runRuleOnSource(OFM063Rule, "Body #area/ here.");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM063");
    expect(errors[0]?.message).toContain("area/");
  });
});
