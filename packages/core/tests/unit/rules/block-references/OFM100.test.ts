/**
 * Unit tests for {@link OFM100Rule}.
 *
 * @module tests/unit/rules/block-references/OFM100.test
 */
import { describe, it, expect } from "bun:test";
import { OFM100Rule } from "../../../../src/infrastructure/rules/ofm/block-references/OFM100-invalid-block-ref.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM100 invalid-block-ref", () => {
  it("flags a block id that exceeds the default 32-char cap", async () => {
    const longId = "a".repeat(33);
    const errors = await runRuleOnSource(OFM100Rule, `Paragraph ^${longId}\n`);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM100");
  });

  it("accepts an id that matches the default pattern", async () => {
    const errors = await runRuleOnSource(OFM100Rule, "Paragraph ^valid-id\n");
    expect(errors).toEqual([]);
  });

  it("respects a custom pattern that forbids uppercase", async () => {
    const errors = await runRuleOnSource(OFM100Rule, "Paragraph ^ABC\n", {
      blockRefs: { idPattern: "^[a-z-]+$", requireUnique: true },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/\^ABC/);
  });

  it("accepts a value that matches a custom pattern", async () => {
    const errors = await runRuleOnSource(OFM100Rule, "Paragraph ^abc\n", {
      blockRefs: { idPattern: "^[a-z-]+$", requireUnique: true },
    });
    expect(errors).toEqual([]);
  });

  it("is a no-op when no block refs are present", async () => {
    const errors = await runRuleOnSource(OFM100Rule, "Just some prose.\n");
    expect(errors).toEqual([]);
  });
});
