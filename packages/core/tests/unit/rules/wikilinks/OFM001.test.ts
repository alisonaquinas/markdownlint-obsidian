/**
 * Unit tests for {@link OFM001Rule}.
 *
 * @module tests/unit/rules/wikilinks/OFM001.test
 */
import { describe, it, expect } from "bun:test";
import { OFM001Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM001-broken-wikilink.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";

describe("OFM001 broken-wikilink", () => {
  it("passes when target exists", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM001Rule, "[[notes/index]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("reports broken target", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM001Rule, "[[missing]]", {}, vault);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM001");
    expect(errors[0]?.message).toContain("missing");
  });

  it("skips when resolve disabled (vault is null)", async () => {
    const errors = await runRuleOnSource(OFM001Rule, "[[missing]]", {}, null);
    expect(errors).toEqual([]);
  });

  it("ignores embeds (they belong to OFM020-series)", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM001Rule, "![[missing]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("resolves by basename", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM001Rule, "[[index]]", {}, vault);
    expect(errors).toEqual([]);
  });
});
