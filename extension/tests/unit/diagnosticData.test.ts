import { describe, expect, it } from "bun:test";
import { lintErrorToDiagnosticData } from "../../src/diagnostics/diagnosticData.js";

describe("lintErrorToDiagnosticData", () => {
  it("converts one-based lint coordinates to zero-based ranges", () => {
    const diagnostic = lintErrorToDiagnosticData({
      ruleCode: "OFM063",
      ruleName: "trailing-slash",
      severity: "warning",
      line: 3,
      column: 5,
      message: "bad tag",
      fixable: true,
    });

    expect(diagnostic.range.start).toEqual({ line: 2, character: 4 });
    expect(diagnostic.source).toBe("markdownlint-obsidian");
  });
});
