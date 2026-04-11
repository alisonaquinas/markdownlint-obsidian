import type { LintError } from "./LintError.js";
import type { ParseResult } from "../parsing/ParseResult.js";
import type { LinterConfig } from "../config/LinterConfig.js";
import type { VaultIndex } from "../vault/VaultIndex.js";
import type { BlockRefIndex } from "../vault/BlockRefIndex.js";
import type { FileExistenceChecker } from "../fs/FileExistenceChecker.js";

/**
 * Per-file inputs supplied to {@link OFMRule.run}.
 *
 * Phase 4+ contract: every rule receives the full {@link ParseResult} (so it
 * can read frontmatter, lines, tokens, and any extracted OFM node arrays),
 * the active {@link LinterConfig} for option lookup, an optional
 * {@link VaultIndex} for wikilink resolution, a {@link FileExistenceChecker}
 * for probing non-markdown assets (Phase 5), and an optional
 * {@link BlockRefIndex} (Phase 6) so rules can answer cross-file block-id
 * lookups without re-parsing every file. `vault` and `blockRefIndex` are
 * both `null` when `config.resolve === false`; rules that need either must
 * guard on that case. `fsCheck` is always present — infrastructure supplies
 * a stub that always returns `false` when no real filesystem is available.
 * Rules must not mutate any of these fields.
 */
export interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
  readonly vault: VaultIndex | null;
  readonly fsCheck: FileExistenceChecker;
  readonly blockRefIndex: BlockRefIndex | null;
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
 * the same set of {@link LintError} instances via `onError`. `run` may return
 * `void` or a `Promise<void>` — the {@link LintUseCase} awaits every return
 * value, so async rules (those that probe the filesystem or perform other
 * IO via `fsCheck`) are first-class. Synchronous rules that return
 * `undefined` are unchanged: `await undefined` is a no-op.
 */
export interface OFMRule {
  readonly names: readonly string[];
  readonly description: string;
  readonly tags: readonly string[];
  readonly severity: "error" | "warning";
  readonly fixable: boolean;
  run(params: RuleParams, onError: OnErrorCallback): void | Promise<void>;
}
