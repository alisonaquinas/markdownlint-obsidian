/**
 * Unit tests for {@link OFM083Rule}.
 *
 * @module tests/unit/rules/frontmatter/OFM083.test
 */
import { describe, it, expect } from "bun:test";
import { OFM083Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM083-invalid-value-type.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

const withTypeMap = (
  typeMap: Record<string, "string" | "number" | "boolean" | "array" | "date">,
): Partial<LinterConfig> => ({
  frontmatter: {
    ...DEFAULT_CONFIG.frontmatter,
    typeMap: Object.freeze(typeMap),
  },
});

describe("OFM083 invalid-value-type", () => {
  it("passes when types match", async () => {
    const errors = await runRuleOnSource(
      OFM083Rule,
      "---\ntags: [a]\ncount: 3\nactive: true\nname: hi\n---\nbody",
      withTypeMap({
        tags: "array",
        count: "number",
        active: "boolean",
        name: "string",
      }),
    );
    expect(errors).toEqual([]);
  });

  it("fails when number expected but string provided", async () => {
    const errors = await runRuleOnSource(
      OFM083Rule,
      "---\ncount: 'three'\n---\nbody",
      withTypeMap({ count: "number" }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM083");
    expect(errors[0]?.message).toContain("count");
    expect(errors[0]?.message).toContain("number");
    expect(errors[0]?.message).toContain("string");
  });

  it("fails when array expected but string provided", async () => {
    const errors = await runRuleOnSource(
      OFM083Rule,
      "---\ntags: hello\n---\nbody",
      withTypeMap({ tags: "array" }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("array");
  });

  it("treats date type via isIsoDate (passes for YAML Date object)", async () => {
    const errors = await runRuleOnSource(
      OFM083Rule,
      "---\ncreated: 2026-04-11\n---\nbody",
      withTypeMap({ created: "date" }),
    );
    expect(errors).toEqual([]);
  });

  it("fails for date type when value is not parseable", async () => {
    const errors = await runRuleOnSource(
      OFM083Rule,
      "---\ncreated: nope\n---\nbody",
      withTypeMap({ created: "date" }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("date");
  });

  it("skips missing keys (OFM080's responsibility)", async () => {
    const errors = await runRuleOnSource(
      OFM083Rule,
      "---\ntitle: x\n---\nbody",
      withTypeMap({ count: "number" }),
    );
    expect(errors).toEqual([]);
  });
});
