import { describe, it, expect } from "vitest";
import { OFM087Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM087-non-string-tag-entry.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM087 non-string-tag-entry", () => {
  it("passes for an all-string tags array", async () => {
    const errors = await runRuleOnSource(
      OFM087Rule,
      "---\ntags: [project, area]\n---\nbody",
    );
    expect(errors).toEqual([]);
  });

  it("fails when tags array contains a number", async () => {
    const errors = await runRuleOnSource(
      OFM087Rule,
      "---\ntags: [project, 42]\n---\nbody",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM087");
    expect(errors[0]?.message).toContain("tags[1]");
  });

  it("fails when tags array contains a boolean", async () => {
    const errors = await runRuleOnSource(
      OFM087Rule,
      "---\ntags: [true]\n---\nbody",
    );
    expect(errors).toHaveLength(1);
  });

  it("ignores non-array tags (OFM083's job)", async () => {
    const errors = await runRuleOnSource(
      OFM087Rule,
      "---\ntags: project\n---\nbody",
    );
    expect(errors).toEqual([]);
  });

  it("ignores files with no tags key", async () => {
    const errors = await runRuleOnSource(OFM087Rule, "---\ntitle: Note\n---\nbody");
    expect(errors).toEqual([]);
  });
});
