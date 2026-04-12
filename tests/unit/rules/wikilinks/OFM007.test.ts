import { describe, it, expect } from "vitest";
import { OFM007Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";
import { makeBlockRefIndex } from "../../../../src/domain/vault/BlockRefIndex.js";

describe("OFM007 wikilink-block-ref (alias of OFM102)", () => {
  it("exposes OFM007 / wikilink-block-ref as its names", () => {
    expect(OFM007Rule.names).toEqual(["OFM007", "wikilink-block-ref"]);
  });

  it("reports when block id is missing on an existing page", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map([["notes/a.md", new Set(["intro"])]]));
    const errors = await runRuleOnSource(
      OFM007Rule,
      "[[a#^missing]]\n",
      {},
      vault,
      undefined,
      blockRefs,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM007");
  });

  it("passes when block id exists on the target", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map([["notes/a.md", new Set(["intro"])]]));
    const errors = await runRuleOnSource(
      OFM007Rule,
      "[[a#^intro]]\n",
      {},
      vault,
      undefined,
      blockRefs,
    );
    expect(errors).toEqual([]);
  });

  it("ignores plain wikilinks without a block ref", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map([["notes/a.md", new Set(["intro"])]]));
    const errors = await runRuleOnSource(OFM007Rule, "[[a]]\n", {}, vault, undefined, blockRefs);
    expect(errors).toEqual([]);
  });

  it("is a no-op when vault is null", async () => {
    const errors = await runRuleOnSource(OFM007Rule, "[[a#^x]]\n");
    expect(errors).toEqual([]);
  });

  it("is a no-op when blockRefIndex is null", async () => {
    const vault = stubVault(["notes/a.md"]);
    const errors = await runRuleOnSource(OFM007Rule, "[[a#^x]]\n", {}, vault);
    expect(errors).toEqual([]);
  });
});
