import { describe, it, expect } from "bun:test";
import { OFM061Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM061-tag-depth-exceeded.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

const withMaxDepth = (maxDepth: number): Partial<LinterConfig> => ({
  tags: { ...DEFAULT_CONFIG.tags, maxDepth },
});

describe("OFM061 tag-depth-exceeded", () => {
  it("passes when all tags fit under the default depth (5)", async () => {
    const errors = await runRuleOnSource(OFM061Rule, "Body #area/notes/sub tag.");
    expect(errors).toEqual([]);
  });

  it("fails when a tag exceeds maxDepth", async () => {
    const errors = await runRuleOnSource(OFM061Rule, "Body #a/b/c text.", withMaxDepth(2));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM061");
    expect(errors[0]?.message).toContain("a/b/c");
    expect(errors[0]?.message).toContain("depth 3");
  });

  it("passes a tag that exactly meets maxDepth", async () => {
    const errors = await runRuleOnSource(OFM061Rule, "Body #a/b text.", withMaxDepth(2));
    expect(errors).toEqual([]);
  });
});
