import type { LintError } from "./LintError.js";

/**
 * Per-file inputs supplied to {@link OFMRule.run}.
 *
 * `tokens` is intentionally typed as `unknown[]` at this layer — the parser
 * adapter (infrastructure) is the only code allowed to refine it. Domain code
 * must not reach into Markdown-It internals.
 */
export interface RuleParams {
  readonly filePath: string;
  readonly lines: readonly string[];
  readonly frontmatter: Record<string, unknown>;
  readonly tokens: unknown[];
}

/**
 * Callback rules invoke once per violation. The runtime supplies `ruleCode`,
 * `ruleName`, `severity`, and `fixable` from the rule's static metadata so
 * rule authors only specify the per-violation fields.
 */
export type OnErrorCallback = (
  error: Omit<LintError, "ruleCode" | "ruleName" | "severity" | "fixable">,
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
