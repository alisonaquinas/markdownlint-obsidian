import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { VaultDetector } from "../domain/vault/VaultDetector.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";
import type { VaultPath } from "../domain/vault/VaultPath.js";
import {
  makeBlockRefIndex,
  type BlockRefIndex,
} from "../domain/vault/BlockRefIndex.js";

/**
 * Output of a successful {@link bootstrapVault} run.
 *
 * Phase 6 widened the bootstrap return type so rules can answer cross-file
 * block-reference lookups without re-parsing every file once per rule. The
 * CLI forwards {@link BootstrapResult.blockRefs} into the rule runtime, and
 * rules that need it (OFM102, etc.) branch on `null` the same way they
 * already branch on a null `vault`.
 */
export interface BootstrapResult {
  readonly vault: VaultIndex;
  readonly blockRefs: BlockRefIndex;
}

/**
 * Infrastructure plumbing {@link bootstrapVault} needs.
 *
 * `detector` and `buildIndex` existed in Phase 4. Phase 6 adds
 * `buildBlockRefIndex`, which is invoked once per LintRun with the files the
 * FileIndex surfaced. The closure supplied by the CLI binds the shared
 * parser + file reader so the extractor used here stays identical to the
 * per-file lint pass.
 */
export interface BootstrapDeps {
  readonly detector: VaultDetector;
  readonly buildIndex: (root: string, opts: { caseSensitive: boolean }) => Promise<VaultIndex>;
  readonly buildBlockRefIndex: (files: readonly VaultPath[]) => Promise<BlockRefIndex>;
}

/**
 * Resolve the vault root, build a {@link VaultIndex}, and build a
 * {@link BlockRefIndex} in one pass. Returned together so the CLI can thread
 * both into every rule via a single bootstrap boundary.
 *
 * Precedence:
 *   1. `config.resolve === false`   → return `null`, rules skip resolution.
 *   2. `config.vaultRoot` override  → skip detector, build directly.
 *   3. Otherwise                    → run `deps.detector.detect(startDir)`.
 *
 * Any error from the detector (notably the `OFM900` prefix) propagates to
 * the caller, which is the CLI's `main.ts` boundary for exit-code 2.
 */
export async function bootstrapVault(
  startDir: string,
  config: LinterConfig,
  deps: BootstrapDeps,
): Promise<BootstrapResult | null> {
  if (!config.resolve) return null;
  const root =
    config.vaultRoot !== null && config.vaultRoot !== undefined
      ? config.vaultRoot
      : await deps.detector.detect(startDir);
  const vault = await deps.buildIndex(root, { caseSensitive: config.wikilinks.caseSensitive });
  const blockRefs = await deps.buildBlockRefIndex(vault.all());
  return { vault, blockRefs };
}

/**
 * Build an empty {@link BlockRefIndex} useful when callers need a placeholder
 * (e.g. when `config.resolve === false` but a downstream component still
 * expects a non-null index).
 */
export function emptyBlockRefIndex(): BlockRefIndex {
  return makeBlockRefIndex(new Map());
}
