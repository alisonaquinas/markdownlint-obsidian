import { describe, it, expect } from "vitest";
import { OFM006Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM006-empty-heading.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM006 empty-wikilink-heading", () => {
  it("flags wikilink with trailing hash and no heading", async () => {
    const errors = await runRuleOnSource(OFM006Rule, "[[page#]]\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM006");
  });

  it("accepts wikilink with a real heading", async () => {
    const errors = await runRuleOnSource(OFM006Rule, "[[page#Heading]]\n");
    expect(errors).toEqual([]);
  });

  it("accepts wikilink without a heading fragment", async () => {
    const errors = await runRuleOnSource(OFM006Rule, "[[page]]\n");
    expect(errors).toEqual([]);
  });
});
