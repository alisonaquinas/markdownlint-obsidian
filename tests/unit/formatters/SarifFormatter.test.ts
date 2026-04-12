import { describe, it, expect } from "vitest";
import { formatSarif } from "../../../src/infrastructure/formatters/SarifFormatter.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";

describe("SarifFormatter", () => {
  it("produces valid SARIF 2.1.0 JSON", () => {
    const err = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 2,
      column: 3,
      message: "broken",
      fixable: false,
    });
    const output = JSON.parse(
      formatSarif([makeLintResult("notes/a.md", [err])]),
    ) as {
      version: string;
      $schema: string;
      runs: Array<{
        tool: { driver: { name: string; rules: unknown[] } };
        results: Array<{
          ruleId: string;
          level: string;
          locations: Array<{
            physicalLocation: {
              artifactLocation: { uri: string };
              region: { startLine: number; startColumn: number };
            };
          }>;
        }>;
      }>;
    };
    expect(output.version).toBe("2.1.0");
    expect(output.$schema).toMatch(/sarif-schema-2\.1\.0\.json$/);
    expect(output.runs[0]?.tool.driver.name).toBe("markdownlint-obsidian");
    expect(output.runs[0]?.results).toHaveLength(1);
    const result = output.runs[0]?.results[0];
    expect(result?.ruleId).toBe("OFM001");
    expect(result?.level).toBe("error");
    expect(result?.locations[0]?.physicalLocation.region.startLine).toBe(2);
    expect(result?.locations[0]?.physicalLocation.region.startColumn).toBe(3);
    expect(result?.locations[0]?.physicalLocation.artifactLocation.uri).toBe("notes/a.md");
  });

  it("deduplicates rule metadata when multiple results share a rule", () => {
    const mkErr = () =>
      makeLintError({
        ruleCode: "OFM001",
        ruleName: "no-broken-wikilinks",
        severity: "error",
        line: 1,
        column: 1,
        message: "x",
        fixable: false,
      });
    const sarif = JSON.parse(
      formatSarif([makeLintResult("a.md", [mkErr(), mkErr()])]),
    ) as { runs: Array<{ tool: { driver: { rules: unknown[] } }; results: unknown[] }> };
    expect(sarif.runs[0]?.tool.driver.rules).toHaveLength(1);
    expect(sarif.runs[0]?.results).toHaveLength(2);
  });

  it("maps warning severity to level warning", () => {
    const err = makeLintError({
      ruleCode: "MD001",
      ruleName: "heading-increment",
      severity: "warning",
      line: 1,
      column: 1,
      message: "warn",
      fixable: false,
    });
    const sarif = JSON.parse(
      formatSarif([makeLintResult("b.md", [err])]),
    ) as { runs: Array<{ results: Array<{ level: string }> }> };
    expect(sarif.runs[0]?.results[0]?.level).toBe("warning");
  });

  it("returns an empty results array when nothing was linted", () => {
    const sarif = JSON.parse(formatSarif([])) as {
      version: string;
      runs: Array<{ tool: { driver: { rules: unknown[] } }; results: unknown[] }>;
    };
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0]?.results).toEqual([]);
    expect(sarif.runs[0]?.tool.driver.rules).toEqual([]);
  });
});
