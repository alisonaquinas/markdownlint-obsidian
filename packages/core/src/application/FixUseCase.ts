/**
 * Purpose: Orchestrates the lint-then-fix workflow by applying rule-generated fixes to files.
 *
 * Provides: {@link runFix}, {@link FixDependencies}, {@link FixOutcome}
 *
 * Role in system: Application-layer use case that delegates linting to {@link runLint},
 * collects fixable violations, patches file content via the injected writer, then performs
 * a second lint pass to confirm the fixed state — all without touching I/O directly.
 *
 * @module application/FixUseCase
 */
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { LintDependencies } from "./LintUseCase.js";
import { runLint } from "./LintUseCase.js";
import { applyFixes } from "../domain/fix/applyFixes.js";
import type { Fix } from "../domain/linting/Fix.js";
import type { FixConflict } from "../domain/linting/FixConflict.js";

export interface FixDependencies extends LintDependencies {
  readonly writeFile: (absolute: string, content: string) => Promise<void>;
}

export interface FixOutcome {
  /**
   * Lint results from the initial pass, before any fixes were applied.
   * Not consumed by the CLI but exposed for programmatic callers that want
   * to compare pre/post violations or surface "was fixable" diagnostics.
   */
  readonly firstPass: readonly LintResult[];
  readonly finalPass: readonly LintResult[];
  readonly filesFixed: readonly string[];
  readonly conflicts: readonly FixConflict[];
}

export async function runFix(
  filePaths: readonly string[],
  config: LinterConfig,
  registry: RuleRegistry,
  deps: FixDependencies,
): Promise<FixOutcome> {
  const firstPass = await runLint(filePaths, config, registry, deps);
  const fixed: string[] = [];
  const allConflicts: FixConflict[] = [];

  for (const result of firstPass) {
    const fixes: Fix[] = result.errors.filter((e) => e.fix !== undefined).map((e) => e.fix as Fix);
    if (fixes.length === 0) continue;

    const raw = await deps.readFile(result.filePath);
    const { patched, conflicts } = applyFixes(raw, fixes, result.filePath);
    allConflicts.push(...conflicts);
    if (patched !== raw) {
      await deps.writeFile(result.filePath, patched);
      fixed.push(result.filePath);
    }
  }

  const finalPass = await runLint(filePaths, config, registry, deps);
  return { firstPass, finalPass, filesFixed: fixed, conflicts: allConflicts };
}
