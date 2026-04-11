import { describe, it, expect } from "vitest";
import { OFM002Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM002-invalid-wikilink-format.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM002 invalid-wikilink-format", () => {
  it("flags empty wikilink", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "some text [[]]\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM002");
    expect(errors[0]?.message).toContain("Empty wikilink");
  });

  it("flags empty wikilink with whitespace", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "[[   ]]\n");
    expect(errors).toHaveLength(1);
  });

  it("flags unclosed wikilink", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "here [[unclosed start\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("Unclosed");
  });

  it("flags nested wikilink", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "[[outer [[inner]]]]\n");
    expect(errors.some((e) => /Nested/.test(e.message))).toBe(true);
  });

  it("accepts valid wikilink", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "[[valid]] and [[another|alias]]\n");
    expect(errors).toEqual([]);
  });

  it("accepts a plain markdown link", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "[text](url)\n");
    expect(errors).toEqual([]);
  });

  it("accepts wikilink with heading fragment", async () => {
    const errors = await runRuleOnSource(OFM002Rule, "[[page#Heading]]\n");
    expect(errors).toEqual([]);
  });
});
