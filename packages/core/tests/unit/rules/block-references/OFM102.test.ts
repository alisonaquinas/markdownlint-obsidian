import { describe, it, expect } from "bun:test";
import { OFM102Rule } from "../../../../src/infrastructure/rules/ofm/block-references/OFM102-broken-block-link.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";
import { makeBlockRefIndex } from "../../../../src/domain/vault/BlockRefIndex.js";

describe("OFM102 broken-block-link", () => {
  it("reports when the block id is missing on an existing page", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map([["notes/a.md", new Set(["intro"])]]));
    const errors = await runRuleOnSource(
      OFM102Rule,
      "See [[a#^missing]]\n",
      {},
      vault,
      undefined,
      blockRefs,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM102");
    expect(errors[0]?.message).toMatch(/\[\[a#\^missing\]\]/);
  });

  it("passes when the block id exists on the target page", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map([["notes/a.md", new Set(["intro"])]]));
    const errors = await runRuleOnSource(
      OFM102Rule,
      "See [[a#^intro]]\n",
      {},
      vault,
      undefined,
      blockRefs,
    );
    expect(errors).toEqual([]);
  });

  it("ignores wikilinks without a block ref", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map([["notes/a.md", new Set(["intro"])]]));
    const errors = await runRuleOnSource(
      OFM102Rule,
      "See [[a]]\n",
      {},
      vault,
      undefined,
      blockRefs,
    );
    expect(errors).toEqual([]);
  });

  it("ignores links whose target page does not resolve", async () => {
    const vault = stubVault(["notes/a.md"]);
    const blockRefs = makeBlockRefIndex(new Map());
    const errors = await runRuleOnSource(
      OFM102Rule,
      "See [[missing#^x]]\n",
      {},
      vault,
      undefined,
      blockRefs,
    );
    expect(errors).toEqual([]);
  });

  it("is a no-op when vault is null", async () => {
    const errors = await runRuleOnSource(OFM102Rule, "See [[a#^x]]\n");
    expect(errors).toEqual([]);
  });

  it("is a no-op when blockRefIndex is null", async () => {
    const vault = stubVault(["notes/a.md"]);
    const errors = await runRuleOnSource(OFM102Rule, "See [[a#^x]]\n", {}, vault);
    expect(errors).toEqual([]);
  });
});
