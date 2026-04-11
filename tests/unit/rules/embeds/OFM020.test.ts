import { describe, it, expect } from "vitest";
import { OFM020Rule } from "../../../../src/infrastructure/rules/ofm/embeds/OFM020-broken-embed.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";

describe("OFM020 broken-embed", () => {
  it("passes when markdown target exists", async () => {
    const vault = stubVault(["notes/target.md"]);
    const errors = await runRuleOnSource(OFM020Rule, "![[notes/target]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("reports broken markdown target", async () => {
    const vault = stubVault(["notes/other.md"]);
    const errors = await runRuleOnSource(OFM020Rule, "![[missing]]", {}, vault);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM020");
    expect(errors[0]?.message).toContain("missing");
  });

  it("resolves by basename", async () => {
    const vault = stubVault(["notes/target.md"]);
    const errors = await runRuleOnSource(OFM020Rule, "![[target]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("skips non-markdown assets (they belong to OFM022)", async () => {
    const vault = stubVault(["notes/target.md"]);
    const errors = await runRuleOnSource(OFM020Rule, "![[picture.png]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("no-ops when resolve disabled (vault is null)", async () => {
    const errors = await runRuleOnSource(OFM020Rule, "![[missing]]", {}, null);
    expect(errors).toEqual([]);
  });

  it("passes when target has explicit .md extension", async () => {
    const vault = stubVault(["notes/target.md"]);
    const errors = await runRuleOnSource(OFM020Rule, "![[notes/target.md]]", {}, vault);
    expect(errors).toEqual([]);
  });
});
