/**
 * Purpose: Produces CodeClimate-style JSON for GitLab Code Quality report artifacts.
 *
 * Provides: {@link formatCodeClimate}
 *
 * Role in system: Infrastructure output adapter registered under `codeclimate` and
 * `gitlab-code-quality`; it converts domain lint findings into GitLab's required report shape
 * without changing domain severity or extending the formatter contract.
 *
 * @module infrastructure/formatters/CodeClimateFormatter
 */
import { createHash } from "node:crypto";
import type { LintError } from "../../domain/linting/LintError.js";
import type { LintResult } from "../../domain/linting/LintResult.js";

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

/**
 * Format lint results as a pretty-printed GitLab Code Quality JSON array.
 *
 * Paths are separator-normalized and lose a leading `./`. Absolute paths remain absolute
 * because the formatter receives no working-directory context from which to relativize them.
 *
 * @param results - Per-file lint results.
 * @returns Pretty-printed CodeClimate-style JSON with no byte order mark.
 */
export function formatCodeClimate(results: readonly LintResult[]): string {
  const issues = results.flatMap((result) => {
    const filePath = normalizePath(result.filePath);
    return result.errors.map((error) => toCodeClimateIssue(filePath, error));
  });
  return JSON.stringify(issues, null, 2);
}

function toCodeClimateIssue(filePath: string, error: LintError): CodeClimateIssue {
  return {
    description: `${error.ruleCode} ${error.ruleName}: ${error.message}`,
    check_name: `${error.ruleCode}/${error.ruleName}`,
    fingerprint: makeFingerprint(filePath, error),
    severity: error.severity === "error" ? "major" : "minor",
    location: {
      path: filePath,
      lines: { begin: error.line },
    },
  };
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^(?:\.\/)+/, "");
}

function makeFingerprint(filePath: string, error: LintError): string {
  return createHash("sha256")
    .update([filePath, error.line, error.column, error.ruleCode, error.message].join("\0"))
    .digest("hex");
}
