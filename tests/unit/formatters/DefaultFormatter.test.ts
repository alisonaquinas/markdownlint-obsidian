import { describe, it, expect } from "bun:test";
import { formatDefault } from "../../../src/infrastructure/formatters/DefaultFormatter.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("DefaultFormatter", () => {
  it("formats a lint error as file:line:col code message", () => {
    const err = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 3,
      column: 5,
      message: "Wikilink 'missing' not found",
      fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    const output = formatDefault([result]);
    expect(output).toContain("notes/index.md:3:5");
    expect(output).toContain("OFM001");
    expect(output).toContain("Wikilink 'missing' not found");
  });

  it("returns empty string for clean results", () => {
    const result = makeLintResult("notes/clean.md", []);
    expect(formatDefault([result])).toBe("");
  });
});
