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

  it("emits a fix that deletes the trailing slash", async () => {
    // "Body #area/ here." — '#area/' starts at column 6 (1-based), raw="#area/", length=6
    // trailing '/' is at column 6+6-1=11
    const errors = await runRuleOnSource(OFM063Rule, "Body #area/ here.");
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 11,
      deleteCount: 1,
      insertText: "",
    });
  });
});
