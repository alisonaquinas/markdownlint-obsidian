/**
 * Unit tests for {@link formatCodeClimate}.
 *
 * @module tests/unit/formatters/CodeClimateFormatter.test
 */
import { describe, expect, it } from "bun:test";
import { formatCodeClimate } from "../../../src/infrastructure/formatters/CodeClimateFormatter.js";
import { getFormatter } from "../../../src/infrastructure/formatters/FormatterRegistry.js";
import { makeLintError, type LintError } from "../../../src/domain/linting/LintError.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";

interface CodeClimateIssue {
  readonly description: string;
  readonly check_name: string;
  readonly fingerprint: string;
  readonly severity: "minor" | "major";
  readonly location: {
    readonly path: string;
    readonly lines: { readonly begin: number };
  };
}

function makeError(overrides: Partial<LintError> = {}): LintError {
  return makeLintError({
    ruleCode: "OFM001",
    ruleName: "no-broken-wikilinks",
    severity: "error",
    line: 12,
    column: 4,
    message: "Broken wikilink target",
    fixable: false,
    ...overrides,
  });
}

function parse(filePath = "docs/example.md", error = makeError()): CodeClimateIssue[] {
  return JSON.parse(formatCodeClimate([makeLintResult(filePath, [error])])) as CodeClimateIssue[];
}

describe("CodeClimateFormatter", () => {
  it("emits one GitLab Code Quality object for each lint error", () => {
    const issues = parse();

    expect(Array.isArray(issues)).toBe(true);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      description: "OFM001 no-broken-wikilinks: Broken wikilink target",
      check_name: "OFM001/no-broken-wikilinks",
      fingerprint: "2bc67f9d7c4335ca07334e7d6a1b66ed6421c37cdff2e36d044e35d991ce72e2",
      severity: "major",
      location: {
        path: "docs/example.md",
        lines: { begin: 12 },
      },
    });
  });

  it("returns an empty JSON array with no BOM when there are no errors", () => {
    const output = formatCodeClimate([]);

    expect(output).toBe("[]");
    expect(output.charCodeAt(0)).toBe(91);
  });

  it("maps warnings to minor and errors to major", () => {
    expect(parse("warning.md", makeError({ severity: "warning" }))[0]?.severity).toBe("minor");
    expect(parse("error.md", makeError({ severity: "error" }))[0]?.severity).toBe("major");
  });

  it("normalizes path separators and strips a leading ./", () => {
    expect(parse(".\\docs\\nested\\example.md")[0]?.location.path).toBe("docs/nested/example.md");
  });

  it("keeps fingerprints stable for identical input", () => {
    expect(parse()[0]?.fingerprint).toBe(parse()[0]?.fingerprint);
  });

  it("changes fingerprints when any identity input changes", () => {
    const fingerprint = parse()[0]?.fingerprint;
    const variants = [
      parse("docs/other.md"),
      parse("docs/example.md", makeError({ line: 13 })),
      parse("docs/example.md", makeError({ column: 5 })),
      parse("docs/example.md", makeError({ ruleCode: "OFM002" })),
      parse("docs/example.md", makeError({ message: "Different violation" })),
    ];

    for (const issues of variants) {
      expect(issues[0]?.fingerprint).not.toBe(fingerprint);
    }
  });

  it("does not include the cosmetic rule name in the fingerprint", () => {
    const original = parse()[0]?.fingerprint;
    const renamed = parse("docs/example.md", makeError({ ruleName: "renamed-rule" }));

    expect(renamed[0]?.fingerprint).toBe(original);
  });
});

describe("CodeClimate formatter registration", () => {
  it("registers the primary name and GitLab alias to the same formatter", () => {
    expect(getFormatter("codeclimate")).toBe(formatCodeClimate);
    expect(getFormatter("gitlab-code-quality")).toBe(formatCodeClimate);
  });
});
