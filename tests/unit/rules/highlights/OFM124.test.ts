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

  it("emits a fix that deletes the entire empty highlight span", async () => {
    // "prose ==   ==" — '==' starts at column 7, text="   " (3 spaces), deleteCount=3+4=7
    const errors = await runRuleOnSource(OFM124Rule, "prose ==   ==\n");
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 7,
      deleteCount: 7,
      insertText: "",
    });
  });
});
