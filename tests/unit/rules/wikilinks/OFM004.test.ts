import { describe, it, expect } from "bun:test";
import { OFM004Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM004-ambiguous-target.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";

describe("OFM004 ambiguous-wikilink-target", () => {
  it("flags basename matching multiple files", async () => {
    const vault = stubVault(["a/same.md", "b/same.md"]);
    const errors = await runRuleOnSource(OFM004Rule, "[[same]]\n", {}, vault);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM004");
    expect(errors[0]?.message).toContain("a/same.md");
    expect(errors[0]?.message).toContain("b/same.md");
  });

  it("does not flag unique basename", async () => {
    const vault = stubVault(["a/only.md"]);
    const errors = await runRuleOnSource(OFM004Rule, "[[only]]\n", {}, vault);
    expect(errors).toEqual([]);
  });

  it("does not flag exact path match even when basename collides", async () => {
    const vault = stubVault(["a/same.md", "b/same.md"]);
    const errors = await runRuleOnSource(OFM004Rule, "[[a/same]]\n", {}, vault);
    expect(errors).toEqual([]);
  });

  it("is a no-op when vault is null", async () => {
    const errors = await runRuleOnSource(OFM004Rule, "[[anything]]\n", {}, null);
    expect(errors).toEqual([]);
  });
});
