import { describe, it, expect } from "bun:test";
import { formatSarif } from "../../../src/infrastructure/formatters/SarifFormatter.js";
import { makeLintError, type LintError } from "../../../src/domain/linting/LintError.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";

interface ParsedSarif {
  version: string;
  $schema: string;
  runs: Array<{
    tool: { driver: { name: string; rules: Array<{ id: string }> } };
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
}

function mkErr(overrides: Partial<LintError> = {}): LintError {
  return makeLintError({
    ruleCode: "OFM001",
    ruleName: "no-broken-wikilinks",
    severity: "error",
    line: 2,
    column: 3,
    message: "broken",
    fixable: false,
    ...overrides,
  });
}

function parse(results: Parameters<typeof formatSarif>[0]): ParsedSarif {
  return JSON.parse(formatSarif(results)) as ParsedSarif;
}

describe("SarifFormatter", () => {
  it("produces valid SARIF 2.1.0 JSON", () => {
    const output = parse([makeLintResult("notes/a.md", [mkErr()])]);
    expect(output.version).toBe("2.1.0");
    expect(output.$schema).toMatch(/sarif-schema-2\.1\.0\.json$/);
    expect(output.runs[0]?.tool.driver.name).toBe("markdownlint-obsidian");
    expect(output.runs[0]?.results).toHaveLength(1);
  });

  it("records line, column, and uri in the first location", () => {
    const output = parse([makeLintResult("notes/a.md", [mkErr()])]);
    const loc = output.runs[0]?.results[0]?.locations[0]?.physicalLocation;
    expect(loc?.region.startLine).toBe(2);
    expect(loc?.region.startColumn).toBe(3);
    expect(loc?.artifactLocation.uri).toBe("notes/a.md");
  });

  it("deduplicates rule metadata when multiple results share a rule", () => {
    const sarif = parse([makeLintResult("a.md", [mkErr(), mkErr()])]);
    expect(sarif.runs[0]?.tool.driver.rules).toHaveLength(1);
    expect(sarif.runs[0]?.results).toHaveLength(2);
  });

  it("maps warning severity to level warning", () => {
    const sarif = parse([
      makeLintResult("b.md", [mkErr({ ruleCode: "MD001", severity: "warning" })]),
    ]);
    expect(sarif.runs[0]?.results[0]?.level).toBe("warning");
  });

  it("returns an empty results array when nothing was linted", () => {
    const sarif = parse([]);
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0]?.results).toEqual([]);
    expect(sarif.runs[0]?.tool.driver.rules).toEqual([]);
  });
});
