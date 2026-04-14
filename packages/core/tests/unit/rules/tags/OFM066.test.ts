/**
 * Unit tests for {@link OFM066Rule}.
 *
 * @module tests/unit/rules/tags/OFM066.test
 */
import { describe, it, expect } from "bun:test";
import { OFM066Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM066-frontmatter-tag-not-in-body.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM066 frontmatter-tag-not-in-body", () => {
  it("passes when every frontmatter tag is mentioned in the body", async () => {
    const errors = await runRuleOnSource(
      OFM066Rule,
      "---\ntags: [project, area]\n---\n\nBody #project and #area.",
    );
    expect(errors).toEqual([]);
  });

  it("warns when a frontmatter tag is missing from the body", async () => {
    const errors = await runRuleOnSource(
      OFM066Rule,
      "---\ntags: [project, ghost]\n---\n\nBody #project only.",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM066");
    expect(errors[0]?.message).toContain("ghost");
  });

  it("ignores files without a frontmatter tags array", async () => {
    const errors = await runRuleOnSource(OFM066Rule, "Body without frontmatter.");
    expect(errors).toEqual([]);
  });

  it("ignores non-string entries in tags array", async () => {
    const errors = await runRuleOnSource(OFM066Rule, "---\ntags: [42]\n---\nBody");
    expect(errors).toEqual([]);
  });
});
