import { describe, it, expect } from "vitest";
import { OFM085Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM085-duplicate-key.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { makeParseResult } from "../../../../src/domain/parsing/ParseResult.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LintError } from "../../../../src/domain/linting/LintError.js";
import { makeLintError } from "../../../../src/domain/linting/LintError.js";

/**
 * NOTE: gray-matter (via js-yaml in strict mode) throws on duplicate top-level
 * keys, so in practice a real markdown file with duplicates surfaces as OFM902
 * before OFM085 ever runs. OFM085 remains as a forward-compat net for any
 * future tolerant parser, and is exercised here by synthesizing a ParseResult
 * directly with a hand-crafted `frontmatterRaw`.
 */
describe("OFM085 duplicate-frontmatter-key", () => {
  it("passes for clean frontmatter (real parser path)", async () => {
    const errors = await runRuleOnSource(
      OFM085Rule,
      "---\ntags: [a]\ntitle: Note\n---\nbody",
    );
    expect(errors).toEqual([]);
  });

  it("returns nothing when the file has no frontmatter", async () => {
    const errors = await runRuleOnSource(OFM085Rule, "# heading\nbody\n");
    expect(errors).toEqual([]);
  });

  it("ignores nested-map keys with the same name", async () => {
    const errors = await runRuleOnSource(
      OFM085Rule,
      "---\nauthor:\n  name: Alison\nname: NotADup\n---\nbody",
    );
    expect(errors).toEqual([]);
  });

  it("reports duplicates when a synthetic ParseResult bypasses gray-matter", () => {
    const parsed = makeParseResult({
      filePath: "synthetic.md",
      frontmatter: { title: "Second" },
      frontmatterRaw: "title: First\ntitle: Second\n",
      frontmatterEndLine: 4,
      tokens: [],
      wikilinks: [],
      embeds: [],
      callouts: [],
      tags: [],
      blockRefs: [],
      highlights: [],
      comments: [],
      raw: "body\n",
      lines: ["body", ""],
    });

    const errors: LintError[] = [];
    OFM085Rule.run({ filePath: "synthetic.md", parsed, config: DEFAULT_CONFIG }, (partial) => {
      errors.push(
        makeLintError({
          ruleCode: "OFM085",
          ruleName: "duplicate-frontmatter-key",
          severity: "error",
          line: partial.line,
          column: partial.column,
          message: partial.message,
          fixable: false,
        }),
      );
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.line).toBe(3);
    expect(errors[0]?.message).toContain("title");
    expect(errors[0]?.message).toContain("also on line 2");
  });
});
