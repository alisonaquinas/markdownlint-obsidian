/**
 * Unit tests for {@link OFM101Rule}.
 *
 * @module tests/unit/rules/block-references/OFM101.test
 */
import { describe, it, expect } from "bun:test";
import { OFM101Rule } from "../../../../src/infrastructure/rules/ofm/block-references/OFM101-duplicate-block-id.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM101 duplicate-block-id", () => {
  it("reports a duplicate block id on a later line", async () => {
    const src = "first line ^same\n\nsecond line ^same\n";
    const errors = await runRuleOnSource(OFM101Rule, src);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM101");
    expect(errors[0]?.message).toMatch(/first on line 1/);
    expect(errors[0]?.line).toBe(3);
  });

  it("accepts distinct block ids", async () => {
    const src = "first ^one\n\nsecond ^two\n";
    const errors = await runRuleOnSource(OFM101Rule, src);
    expect(errors).toEqual([]);
  });

  it("is a no-op when requireUnique is false", async () => {
    const src = "first ^same\n\nsecond ^same\n";
    const errors = await runRuleOnSource(OFM101Rule, src, {
      blockRefs: { idPattern: "^[A-Za-z0-9-]+$", requireUnique: false },
    });
    expect(errors).toEqual([]);
  });

  it("reports every duplicate after the first", async () => {
    const src = "a ^x\n\nb ^x\n\nc ^x\n";
    const errors = await runRuleOnSource(OFM101Rule, src);
    expect(errors).toHaveLength(2);
  });
});
