/**
 * Unit tests for {@link OFM065Rule}.
 *
 * @module tests/unit/rules/tags/OFM065.test
 */
import { describe, it, expect } from "bun:test";
import { OFM065Rule } from "../../../../src/infrastructure/rules/ofm/tags/OFM065-mixed-case-tag.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

describe("OFM065 mixed-case-tag", () => {
  it("passes when casing is uniform", async () => {
    const errors = await runRuleOnSource(OFM065Rule, "Body #project here and #project there.");
    expect(errors).toEqual([]);
  });

  it("warns when a later occurrence changes case", async () => {
    const errors = await runRuleOnSource(OFM065Rule, "Body #project then #Project later.");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM065");
    expect(errors[0]?.message).toContain("Project");
    expect(errors[0]?.message).toContain("project");
  });

  it("is a no-op when caseSensitive is true", async () => {
    const errors = await runRuleOnSource(OFM065Rule, "Body #project then #Project later.", {
      tags: { ...DEFAULT_CONFIG.tags, caseSensitive: true },
    });
    expect(errors).toEqual([]);
  });

  it("emits a fix that replaces the wrong-case tag with the canonical form", async () => {
    // "Body #project then #Project later."
    // '#Project' starts at column 20 (1-based), raw="#Project", length=8
    // canonical seen="project", so insertText="#project"
    const errors = await runRuleOnSource(OFM065Rule, "Body #project then #Project later.");
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 20,
      deleteCount: 8,
      insertText: "#project",
    });
  });
});
