import type { LintError } from "./LintError.js";
import type { ParseResult } from "../parsing/ParseResult.js";
import type { LinterConfig } from "../config/LinterConfig.js";
import type { VaultIndex } from "../vault/VaultIndex.js";

/**
 * Per-file inputs supplied to {@link OFMRule.run}.
 *
 * Phase 4+ contract: every rule receives the full {@link ParseResult} (so it
 * can read frontmatter, lines, tokens, and any extracted OFM node arrays),
 * the active {@link LinterConfig} for option lookup, and an optional
 * {@link VaultIndex} for wikilink resolution. `vault` is `null` when
 * `config.resolve === false`; rules that need it must guard on that case.
 * Rules must not mutate any of these fields.
 */
export interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
  readonly vault: VaultIndex | null;
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
