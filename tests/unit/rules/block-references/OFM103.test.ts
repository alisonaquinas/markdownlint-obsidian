import { describe, it, expect } from "bun:test";
import { OFM103Rule } from "../../../../src/infrastructure/rules/ofm/block-references/OFM103-block-ref-on-heading.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM103 block-ref-on-heading", () => {
  it("warns on a heading with a trailing block id", async () => {
    const errors = await runRuleOnSource(OFM103Rule, "# Heading ^intro\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM103");
    expect(errors[0]?.severity).toBe("warning");
  });

  it("warns at every heading level up to h6", async () => {
    for (let level = 1; level <= 6; level += 1) {
      const marker = "#".repeat(level);
      const errors = await runRuleOnSource(OFM103Rule, `${marker} Heading ^id${level}\n`);
      expect(errors).toHaveLength(1);
    }
  });

  it("passes on a paragraph block ref", async () => {
    const errors = await runRuleOnSource(OFM103Rule, "Paragraph body ^intro\n");
    expect(errors).toEqual([]);
  });

  it("ignores headings without a block ref", async () => {
    const errors = await runRuleOnSource(OFM103Rule, "# Heading only\n");
    expect(errors).toEqual([]);
  });
});
