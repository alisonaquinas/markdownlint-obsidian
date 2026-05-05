import type { LintError } from "markdownlint-obsidian/api";
import type { DiagnosticData, TextRange } from "../shared/types.js";

export function lintErrorToDiagnosticData(error: LintError): DiagnosticData {
  return {
    range: errorRange(error),
    severity: error.severity,
    source: "markdownlint-obsidian",
    code: error.ruleCode,
    message: error.message,
    fixable: error.fix !== undefined || error.fixable,
  };
}

function errorRange(error: LintError): TextRange {
  const line = Math.max(0, error.line - 1);
  const character = Math.max(0, error.column - 1);
  return {
    start: { line, character },
    end: { line, character: character + 1 },
  };
}
