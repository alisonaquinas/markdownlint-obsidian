import { describe, it, expect } from "bun:test";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("LintResult", () => {
  it("holds file path and errors", () => {
    const err = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 1,
      column: 1,
      message: "msg",
      fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    expect(result.filePath).toBe("notes/index.md");
    expect(result.errors).toHaveLength(1);
  });

  it("hasErrors is true when errors present", () => {
    const err = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 1,
      column: 1,
      message: "msg",
      fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    expect(result.hasErrors).toBe(true);
  });

  it("hasErrors is false for clean file", () => {
    const result = makeLintResult("notes/clean.md", []);
    expect(result.hasErrors).toBe(false);
  });
});
