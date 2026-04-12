import type { LintResult } from "../../domain/linting/LintResult.js";
import type { LintError } from "../../domain/linting/LintError.js";

const TOOL_NAME = "markdownlint-obsidian";
const TOOL_VERSION = "0.8.0";
const INFORMATION_URI = "https://github.com/alisonaquinas/markdownlint-obsidian";
const SARIF_SCHEMA =
  "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json";

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  defaultConfiguration: { level: "error" | "warning" | "note" };
}

interface SarifResult {
  ruleId: string;
  level: "error" | "warning";
  message: { text: string };
  locations: ReadonlyArray<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number; startColumn: number };
    };
  }>;
}

/**
 * Format lint results as SARIF 2.1.0 JSON.
 *
 * SARIF is the log format GitHub code-scanning consumes, so the output
 * must match the 2.1.0 schema exactly: one run, `tool.driver.rules`
 * deduplicated by rule id, and `results[].level` restricted to
 * `"error" | "warning"`.
 *
 * @param results - Per-file lint results.
 * @returns Pretty-printed SARIF JSON string.
 */
export function formatSarif(results: readonly LintResult[]): string {
  const rulesById = new Map<string, SarifRule>();
  const sarifResults: SarifResult[] = [];

  for (const file of results) {
    for (const err of file.errors) {
      if (!rulesById.has(err.ruleCode)) {
        rulesById.set(err.ruleCode, toSarifRule(err));
      }
      sarifResults.push({
        ruleId: err.ruleCode,
        level: err.severity,
        message: { text: err.message },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: file.filePath },
              region: { startLine: err.line, startColumn: err.column },
            },
          },
        ],
      });
    }
  }

  const doc = {
    $schema: SARIF_SCHEMA,
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: TOOL_NAME,
            version: TOOL_VERSION,
            informationUri: INFORMATION_URI,
            rules: [...rulesById.values()],
          },
        },
        results: sarifResults,
      },
    ],
  };

  return JSON.stringify(doc, null, 2);
}

function toSarifRule(err: LintError): SarifRule {
  return {
    id: err.ruleCode,
    name: err.ruleName,
    shortDescription: { text: err.ruleName },
    defaultConfiguration: { level: err.severity },
  };
}
