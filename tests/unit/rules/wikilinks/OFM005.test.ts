import { describe, it, expect } from "vitest";
import { OFM005Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM005-case-mismatch.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";

describe("OFM005 wikilink-case-mismatch", () => {
  it("warns when only case-insensitive match resolves", async () => {
    const vault = stubVault(["notes/Index.md"]);
    const errors = await runRuleOnSource(OFM005Rule, "[[notes/index]]", {}, vault);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM005");
    expect(errors[0]?.message).toContain("notes/Index.md");
  });

  it("does not warn on exact match", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM005Rule, "[[notes/index]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("does not warn on basename match (different strategy)", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM005Rule, "[[index]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("is a no-op when vault is null", async () => {
    const errors = await runRuleOnSource(OFM005Rule, "[[anything]]", {}, null);
    expect(errors).toEqual([]);
  });
});
