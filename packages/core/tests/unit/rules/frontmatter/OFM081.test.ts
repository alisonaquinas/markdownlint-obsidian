/**
 * Unit tests for {@link OFM081Rule}.
 *
 * @module tests/unit/rules/frontmatter/OFM081.test
 */
import { describe, it, expect } from "bun:test";
import { OFM081Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM081-invalid-date-format.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

const withDateFields = (dateFields: readonly string[]): Partial<LinterConfig> => ({
  frontmatter: {
    ...DEFAULT_CONFIG.frontmatter,
    dateFields: Object.freeze(dateFields),
  },
});

describe("OFM081 invalid-date-format", () => {
  it("passes when the date is a valid ISO string", async () => {
    const errors = await runRuleOnSource(
      OFM081Rule,
      "---\ncreated: '2026-04-11T12:00:00Z'\n---\nbody",
      withDateFields(["created"]),
    );
    expect(errors).toEqual([]);
  });

  it("passes when the date is an unquoted YAML date (Date object)", async () => {
    const errors = await runRuleOnSource(
      OFM081Rule,
      "---\ncreated: 2026-04-11\n---\nbody",
      withDateFields(["created"]),
    );
    expect(errors).toEqual([]);
  });

  it("fails when the date is a non-ISO string", async () => {
    const errors = await runRuleOnSource(
      OFM081Rule,
      "---\ncreated: not-a-date\n---\nbody",
      withDateFields(["created"]),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM081");
    expect(errors[0]?.message).toContain("created");
  });

  it("skips missing date fields (OFM080's job)", async () => {
    const errors = await runRuleOnSource(
      OFM081Rule,
      "---\ntitle: Note\n---\nbody",
      withDateFields(["created"]),
    );
    expect(errors).toEqual([]);
  });

  it("reports each invalid date independently", async () => {
    const errors = await runRuleOnSource(
      OFM081Rule,
      "---\ncreated: nope\nupdated: also-bad\n---\nbody",
      withDateFields(["created", "updated"]),
    );
    expect(errors).toHaveLength(2);
  });
});
