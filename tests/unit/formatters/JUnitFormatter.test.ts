import { describe, it, expect } from "vitest";
import { formatJUnit } from "../../../src/infrastructure/formatters/JUnitFormatter.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";

describe("JUnitFormatter", () => {
  it("wraps every result in a testsuite", () => {
    const err = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 1,
      column: 1,
      message: "broken",
      fixable: false,
    });
    const results = [makeLintResult("notes/a.md", [err]), makeLintResult("notes/b.md", [])];
    const xml = formatJUnit(results);
    expect(xml).toContain(`<testsuite name="notes/a.md"`);
    expect(xml).toContain("<failure");
    expect(xml).toContain("OFM001");
    expect(xml).toContain(`<testsuite name="notes/b.md"`);
  });

  it("escapes XML-hostile message text", () => {
    const err = makeLintError({
      ruleCode: "OFM002",
      ruleName: "x",
      severity: "error",
      line: 1,
      column: 1,
      message: `bad <tag> & "quote"`,
      fixable: false,
    });
    const xml = formatJUnit([makeLintResult("x.md", [err])]);
    expect(xml).not.toContain("<tag>");
    expect(xml).toContain("&lt;tag&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
  });

  it("emits a synthetic clean testcase when a file has no errors", () => {
    const results = [makeLintResult("notes/clean.md", [])];
    const xml = formatJUnit(results);
    expect(xml).toContain(`<testsuite name="notes/clean.md"`);
    expect(xml).toContain(`name="clean"`);
    expect(xml).not.toContain("<failure");
  });

  it("snapshots a representative run", () => {
    const err = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 3,
      column: 5,
      message: "missing target",
      fixable: false,
    });
    expect(formatJUnit([makeLintResult("notes/index.md", [err])])).toMatchSnapshot();
  });
});
