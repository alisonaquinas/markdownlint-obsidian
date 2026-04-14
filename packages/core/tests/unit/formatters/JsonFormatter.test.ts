/**
 * Unit tests for {@link formatJson}.
 *
 * @module tests/unit/formatters/JsonFormatter.test
 */
import { describe, it, expect } from "bun:test";
import { formatJson } from "../../../src/infrastructure/formatters/JsonFormatter.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("JsonFormatter", () => {
  it("outputs valid JSON array", () => {
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
    const json = JSON.parse(formatJson([result])) as Array<{
      filePath: string;
      errors: Array<{ ruleCode: string }>;
    }>;
    expect(Array.isArray(json)).toBe(true);
    expect(json[0]?.filePath).toBe("notes/index.md");
    expect(json[0]?.errors[0]?.ruleCode).toBe("OFM001");
  });
});
