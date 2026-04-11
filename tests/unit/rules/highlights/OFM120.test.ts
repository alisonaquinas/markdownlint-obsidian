import { describe, it, expect } from "vitest";
import { OFM120Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM120-disallowed-highlight.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM120 disallowed-highlight", () => {
  it("reports every highlight when allow is false", async () => {
    const src = "a ==one== and ==two==\n";
    const errors = await runRuleOnSource(OFM120Rule, src, {
      highlights: { allow: false, allowedGlobs: [] },
    });
    expect(errors).toHaveLength(2);
    expect(errors[0]?.ruleCode).toBe("OFM120");
  });

  it("is a no-op when allow is true (default)", async () => {
    const src = "prose ==one==\n";
    const errors = await runRuleOnSource(OFM120Rule, src);
    expect(errors).toEqual([]);
  });

  it("exempts files that match an allowedGlobs entry", async () => {
    const src = "prose ==one==\n";
    const errors = await runRuleOnSource(OFM120Rule, src, {
      highlights: { allow: false, allowedGlobs: ["test.md"] },
    });
    expect(errors).toEqual([]);
  });

  it("reports when the file is outside allowedGlobs", async () => {
    const src = "prose ==one==\n";
    const errors = await runRuleOnSource(OFM120Rule, src, {
      highlights: { allow: false, allowedGlobs: ["notes/daily/*.md"] },
    });
    expect(errors).toHaveLength(1);
  });

  it("is a no-op for files with no highlights", async () => {
    const errors = await runRuleOnSource(OFM120Rule, "plain prose\n", {
      highlights: { allow: false, allowedGlobs: [] },
    });
    expect(errors).toEqual([]);
  });
});
