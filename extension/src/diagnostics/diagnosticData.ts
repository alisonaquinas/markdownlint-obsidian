/**
 * Converts core lint errors into editor-neutral diagnostic payloads.
 *
 * Core lint coordinates are one-based. VS Code ranges are zero-based, so this
 * module owns that translation before the runtime creates `vscode.Diagnostic`
 * instances.
 *
 * @module diagnostics/diagnosticData
 */

import type { LintError } from "markdownlint-obsidian/api";
import type { DiagnosticData, TextRange } from "../shared/types.js";

/**
 * Map one core lint error into a diagnostic data object.
 *
 * @param error - Lint error returned by the bundled core library.
 * @returns Editor-neutral diagnostic data with zero-based range coordinates.
 */
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
