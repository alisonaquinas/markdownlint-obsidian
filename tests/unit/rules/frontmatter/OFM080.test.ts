import { describe, it, expect } from "bun:test";
import { OFM080Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM080-missing-required-key.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

const withRequired = (required: readonly string[]): Partial<LinterConfig> => ({
  frontmatter: {
    ...DEFAULT_CONFIG.frontmatter,
    required: Object.freeze(required),
  },
});

describe("OFM080 missing-required-key", () => {
  it("passes when all required keys present", async () => {
    const errors = await runRuleOnSource(
      OFM080Rule,
      "---\ntags: [a]\nauthor: X\n---\nbody",
      withRequired(["tags", "author"]),
    );
    expect(errors).toEqual([]);
  });

  it("reports the missing key on line 1", async () => {
    const errors = await runRuleOnSource(
      OFM080Rule,
      "---\ntags: [a]\n---\nbody",
      withRequired(["tags", "author"]),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM080");
    expect(errors[0]?.line).toBe(1);
    expect(errors[0]?.message).toContain("author");
  });

  it("reports each missing key independently", async () => {
    const errors = await runRuleOnSource(
      OFM080Rule,
      "---\ntitle: Note\n---\nbody",
      withRequired(["tags", "author"]),
    );
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.message).join("\n")).toContain("tags");
    expect(errors.map((e) => e.message).join("\n")).toContain("author");
  });

  it("reports nothing when no required keys configured", async () => {
    const errors = await runRuleOnSource(OFM080Rule, "---\n---\nbody");
    expect(errors).toEqual([]);
  });

  it("supports dotted paths into nested frontmatter", async () => {
    const ok = await runRuleOnSource(
      OFM080Rule,
      "---\nauthor:\n  name: Alison\n---\nbody",
      withRequired(["author.name"]),
    );
    expect(ok).toEqual([]);

    const missing = await runRuleOnSource(
      OFM080Rule,
      "---\nauthor:\n  email: a@b.c\n---\nbody",
      withRequired(["author.name"]),
    );
    expect(missing).toHaveLength(1);
    expect(missing[0]?.message).toContain("author.name");
  });
});
