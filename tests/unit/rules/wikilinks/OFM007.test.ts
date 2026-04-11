import { describe, it, expect } from "vitest";
import { OFM007Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";

describe("OFM007 wikilink-block-ref", () => {
  it("warns on block ref targeting missing file", async () => {
    const vault = stubVault(["notes/existing.md"]);
    const errors = await runRuleOnSource(OFM007Rule, "[[missing#^block1]]\n", {}, vault);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM007");
  });

  it("does not warn when target file exists", async () => {
    const vault = stubVault(["notes/existing.md"]);
    const errors = await runRuleOnSource(OFM007Rule, "[[existing#^block1]]\n", {}, vault);
    expect(errors).toEqual([]);
  });

  it("ignores plain wikilinks without a block ref", async () => {
    const vault = stubVault(["notes/existing.md"]);
    const errors = await runRuleOnSource(OFM007Rule, "[[missing]]\n", {}, vault);
    expect(errors).toEqual([]);
  });

  it("is a no-op when vault is null", async () => {
    const errors = await runRuleOnSource(OFM007Rule, "[[anything#^x]]\n", {}, null);
    expect(errors).toEqual([]);
  });
});
