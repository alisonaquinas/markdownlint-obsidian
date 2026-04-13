import { describe, it, expect } from "bun:test";
import { OFM121Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM121-disallowed-comment.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM121 disallowed-comment", () => {
  it("allows single-line comment under default config", async () => {
    const errors = await runRuleOnSource(OFM121Rule, "text %%inline%% more\n");
    expect(errors).toEqual([]);
  });

  it("reports every comment when allow is false", async () => {
    const src = "first %%one%% and %%two%%\n";
    const errors = await runRuleOnSource(OFM121Rule, src, {
      comments: { allow: false, disallowMultiline: false },
    });
    expect(errors).toHaveLength(2);
    expect(errors[0]?.ruleCode).toBe("OFM121");
  });

  it("reports multi-line comments when disallowMultiline is true", async () => {
    const src = "before %%\nmulti\nline\n%% after\n";
    const errors = await runRuleOnSource(OFM121Rule, src, {
      comments: { allow: true, disallowMultiline: true },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/Multi-line/);
  });

  it("keeps single-line comments when only disallowMultiline is set", async () => {
    const errors = await runRuleOnSource(OFM121Rule, "prose %%inline%%\n", {
      comments: { allow: true, disallowMultiline: true },
    });
    expect(errors).toEqual([]);
  });
});
