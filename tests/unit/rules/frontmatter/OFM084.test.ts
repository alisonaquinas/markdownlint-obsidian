import { describe, it, expect } from "vitest";
import { OFM084Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM084-empty-required-key.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

const withRequired = (required: readonly string[]): Partial<LinterConfig> => ({
  frontmatter: {
    ...DEFAULT_CONFIG.frontmatter,
    required: Object.freeze(required),
  },
});

describe("OFM084 empty-required-key", () => {
  it("passes when required keys are populated", async () => {
    const errors = await runRuleOnSource(
      OFM084Rule,
      "---\ntags: [a]\nauthor: Alison\n---\nbody",
      withRequired(["tags", "author"]),
    );
    expect(errors).toEqual([]);
  });

  it("fails when a required key is empty string", async () => {
    const errors = await runRuleOnSource(
      OFM084Rule,
      "---\nauthor: ''\n---\nbody",
      withRequired(["author"]),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM084");
  });

  it("fails when a required key is null", async () => {
    const errors = await runRuleOnSource(
      OFM084Rule,
      "---\nauthor: null\n---\nbody",
      withRequired(["author"]),
    );
    expect(errors).toHaveLength(1);
  });

  it("fails when a required key is an empty array", async () => {
    const errors = await runRuleOnSource(
      OFM084Rule,
      "---\ntags: []\n---\nbody",
      withRequired(["tags"]),
    );
    expect(errors).toHaveLength(1);
  });

  it("skips missing keys (OFM080's job)", async () => {
    const errors = await runRuleOnSource(
      OFM084Rule,
      "---\ntitle: Note\n---\nbody",
      withRequired(["author"]),
    );
    expect(errors).toEqual([]);
  });
});
