import { describe, it, expect } from "vitest";
import { OFM086Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM086-trailing-whitespace-in-string.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM086 frontmatter-trailing-whitespace", () => {
  it("passes when no string has trailing whitespace", async () => {
    const errors = await runRuleOnSource(
      OFM086Rule,
      "---\ntitle: Note\nauthor: Alison\n---\nbody",
    );
    expect(errors).toEqual([]);
  });

  it("warns on a top-level trailing-space string", async () => {
    // The trailing whitespace must survive YAML parsing, so we use a quoted scalar.
    const errors = await runRuleOnSource(
      OFM086Rule,
      "---\ntitle: \"Note  \"\n---\nbody",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM086");
    expect(errors[0]?.message).toContain("title");
  });

  it("walks into nested objects", async () => {
    const errors = await runRuleOnSource(
      OFM086Rule,
      "---\nauthor:\n  name: \"Alison \"\n---\nbody",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("author.name");
  });

  it("walks into arrays", async () => {
    const errors = await runRuleOnSource(
      OFM086Rule,
      "---\ntags:\n  - \"first \"\n  - clean\n---\nbody",
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("tags.0");
  });
});
