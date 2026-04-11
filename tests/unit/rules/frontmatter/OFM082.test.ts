import { describe, it, expect } from "vitest";
import { OFM082Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM082-unknown-top-level-key.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

const strictTypeMap = (
  typeMap: Record<string, "string" | "number" | "boolean" | "array" | "date">,
) => ({
  frontmatter: {
    ...DEFAULT_CONFIG.frontmatter,
    typeMap: Object.freeze(typeMap),
    allowUnknown: false,
  },
});

describe("OFM082 unknown-top-level-key", () => {
  it("is a no-op when allowUnknown is true (default)", async () => {
    const errors = await runRuleOnSource(
      OFM082Rule,
      "---\nweird: yes\n---\nbody",
    );
    expect(errors).toEqual([]);
  });

  it("passes when every key is known", async () => {
    const errors = await runRuleOnSource(
      OFM082Rule,
      "---\ntags: [a]\ntitle: Note\n---\nbody",
      strictTypeMap({ tags: "array", title: "string" }),
    );
    expect(errors).toEqual([]);
  });

  it("warns when an unknown key appears", async () => {
    const errors = await runRuleOnSource(
      OFM082Rule,
      "---\ntags: [a]\nnope: 1\n---\nbody",
      strictTypeMap({ tags: "array" }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM082");
    expect(errors[0]?.message).toContain("nope");
  });
});
