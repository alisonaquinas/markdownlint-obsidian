/**
 * Unit tests for {@link OFM064Rule}.
 *
 * @module tests/unit/rules/tags/OFM064.test
 */
import { describe, it, expect } from "bun:test";
import { OFM064Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM064-duplicate-tag.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

describe("OFM064 duplicate-tag", () => {
  it("passes when each tag occurs once", async () => {
    const errors = await runRuleOnSource(OFM064Rule, "Body with #project and #area tags.");
    expect(errors).toEqual([]);
  });

  it("warns on a literal duplicate", async () => {
    const errors = await runRuleOnSource(OFM064Rule, "Body #project once and #project twice.");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM064");
    expect(errors[0]?.message).toContain("first seen on line 1");
  });

  it("warns on a case-insensitive duplicate by default", async () => {
    const errors = await runRuleOnSource(OFM064Rule, "Body #Project once and #project twice.");
    expect(errors).toHaveLength(1);
  });

  it("ignores case differences when caseSensitive is true", async () => {
    const errors = await runRuleOnSource(OFM064Rule, "Body #Project once and #project twice.", {
      tags: { ...DEFAULT_CONFIG.tags, caseSensitive: true },
    });
    expect(errors).toEqual([]);
  });
});
