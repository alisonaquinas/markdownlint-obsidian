import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import { makeLintResult } from "../domain/linting/LintResult.js";

/**
 * Application use case that lints a batch of files against every rule in the
 * supplied registry.
 *
 * Phase 1 behaviour: since no rules are registered yet, every file yields
 * a clean {@link LintResult}. The parser pipeline and rule engine land in
 * Phase 2; this stub keeps the CLI green so the harness can be exercised
 * end-to-end.
 *
 * @param filePaths - Absolute paths of files to lint.
 * @param _config - Merged configuration for this run (unused in Phase 1).
 * @param _registry - Rule registry (unused in Phase 1).
 * @returns One {@link LintResult} per input file.
 */
export async function runLint(
  filePaths: readonly string[],
  _config: LinterConfig,
  _registry: RuleRegistry,
): Promise<LintResult[]> {
  return filePaths.map((fp) => makeLintResult(fp, []));
}
