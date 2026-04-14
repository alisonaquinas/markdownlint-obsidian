/**
 * Unit tests for {@link OFM043Rule}.
 *
 * @module tests/unit/rules/callouts/OFM043.test
 */
import { describe, it, expect } from "bun:test";
import { OFM043Rule } from "../../../../src/infrastructure/rules/ofm/callouts/OFM043-callout-in-list.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM043 callout-in-list", () => {
  it("passes when callout is separated from list by a blank line", async () => {
    const src = "- item\n\n> [!NOTE] Title\n> body\n";
    const errors = await runRuleOnSource(OFM043Rule, src);
    expect(errors).toEqual([]);
  });

  it("flags callout directly following a bullet list item", async () => {
    const src = "- item\n> [!NOTE] Title\n> body\n";
    const errors = await runRuleOnSource(OFM043Rule, src);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM043");
  });

  it("flags callout directly following an ordered list item", async () => {
    const src = "1. item\n> [!NOTE] Title\n> body\n";
    const errors = await runRuleOnSource(OFM043Rule, src);
    expect(errors).toHaveLength(1);
  });

  it("flags callout directly following a starred list item", async () => {
    const src = "* item\n> [!NOTE] Title\n> body\n";
    const errors = await runRuleOnSource(OFM043Rule, src);
    expect(errors).toHaveLength(1);
  });

  it("passes when callout is the first line in the file", async () => {
    const errors = await runRuleOnSource(OFM043Rule, "> [!NOTE] Title\n> body\n");
    expect(errors).toEqual([]);
  });
});
