/**
 * Unit tests for {@link OFM104Rule}.
 *
 * @module tests/unit/rules/block-references/OFM104.test
 */
import { describe, it, expect } from "bun:test";
import { OFM104Rule } from "../../../../src/infrastructure/rules/ofm/block-references/OFM104-block-id-format.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM104 block-id-case", () => {
  it("warns on an uppercase id", async () => {
    const errors = await runRuleOnSource(OFM104Rule, "Paragraph ^Intro\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM104");
    expect(errors[0]?.severity).toBe("warning");
    expect(errors[0]?.fixable).toBe(true);
    expect(errors[0]?.message).toMatch(/\^Intro/);
  });

  it("warns on a mixed-case id", async () => {
    const errors = await runRuleOnSource(OFM104Rule, "Paragraph ^myBlock\n");
    expect(errors).toHaveLength(1);
  });

  it("passes on a lowercase id", async () => {
    const errors = await runRuleOnSource(OFM104Rule, "Paragraph ^intro-1\n");
    expect(errors).toEqual([]);
  });

  it("passes on an id with only digits and hyphens", async () => {
    const errors = await runRuleOnSource(OFM104Rule, "Paragraph ^123-abc\n");
    expect(errors).toEqual([]);
  });

  it("emits a fix that lowercases the block id", async () => {
    // "Paragraph ^Intro" — '^' is at column 11, id "Intro" starts at column 12
    // fix replaces "Intro" (length 5) with "intro"
    const errors = await runRuleOnSource(OFM104Rule, "Paragraph ^Intro\n");
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 12,
      deleteCount: 5,
      insertText: "intro",
    });
  });
});
