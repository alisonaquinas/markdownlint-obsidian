import { describe, it, expect } from "bun:test";
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

  it("emits a fix that replaces the wikilink target with the canonical path", async () => {
    // "[[notes/index]]" — '[' at column 1, '[[' takes 2 chars, target starts at column 3
    // target "notes/index" has length 11, canonical is "notes/Index.md"
    const vault = stubVault(["notes/Index.md"]);
    const errors = await runRuleOnSource(OFM005Rule, "[[notes/index]]", {}, vault);
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 3,
      deleteCount: 11,
      insertText: "notes/Index.md",
    });
  });
});
