import type { LintError } from "./LintError.js";
import type { ParseResult } from "../parsing/ParseResult.js";
import type { LinterConfig } from "../config/LinterConfig.js";

/**
 * Per-file inputs supplied to {@link OFMRule.run}.
 *
 * Phase 3+ contract: every rule receives the full {@link ParseResult} (so it
 * can read frontmatter, lines, tokens, and any extracted OFM node arrays) plus
 * the active {@link LinterConfig} for option lookup. Rules must not mutate
 * either field.
 */
export interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
}

/**
 * Callback rules invoke once per violation. The runtime supplies `ruleCode`,
 * `ruleName`, `severity`, and `fixable` from the rule's static metadata so
 * rule authors only specify the per-violation fields.
 */
export type OnErrorCallback = (
  error: Pick<LintError, "line" | "column" | "message"> & { fix?: LintError["fix"] },
) => void;

/**
 * Contract every linting rule must satisfy.
 *
 * Rules are stateless and pure: given the same {@link RuleParams} they emit
 * the same set of {@link LintError} instances via `onError`.
 */
export interface OFMRule {
  readonly names: readonly string[];
  readonly description: string;
  readonly tags: readonly string[];
  readonly severity: "error" | "warning";
  readonly fixable: boolean;
  run(params: RuleParams, onError: OnErrorCallback): void;
}
