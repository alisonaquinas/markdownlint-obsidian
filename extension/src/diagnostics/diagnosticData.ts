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

/** Stable identity fields shared by a lint error and its VS Code diagnostic. */
export interface DiagnosticIdentity {
  readonly code: string;
  readonly message: string;
  readonly line: number;
  readonly character: number;
}

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

/**
 * Build the identity used to match diagnostics back to their source lint error.
 *
 * @param error - Lint error returned by the bundled core library.
 * @returns Stable diagnostic identity using VS Code's zero-based coordinates.
 */
export function lintErrorDiagnosticIdentity(error: LintError): DiagnosticIdentity {
  return {
    code: error.ruleCode,
    message: error.message,
    line: Math.max(0, error.line - 1),
    character: Math.max(0, error.column - 1),
  };
}

/**
 * Compare diagnostic identity fields without collapsing duplicate messages.
 *
 * @param error - Candidate lint error.
 * @param diagnostic - Identity fields from a VS Code diagnostic.
 * @returns True when the diagnostic points at this exact lint error.
 */
export function matchesDiagnosticIdentity(
  error: LintError,
  diagnostic: DiagnosticIdentity,
): boolean {
  const identity = lintErrorDiagnosticIdentity(error);
  return (
    identity.code === diagnostic.code &&
    identity.message === diagnostic.message &&
    identity.line === diagnostic.line &&
    identity.character === diagnostic.character
  );
}

function errorRange(error: LintError): TextRange {
  const line = Math.max(0, error.line - 1);
  const character = Math.max(0, error.column - 1);
  return {
    start: { line, character },
    end: { line, character: character + 1 },
  };
}
