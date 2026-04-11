import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { VaultDetector } from "../domain/vault/VaultDetector.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";

export interface BootstrapDeps {
  readonly detector: VaultDetector;
  readonly buildIndex: (root: string, opts: { caseSensitive: boolean }) => Promise<VaultIndex>;
}

/**
 * Resolve the vault root and build a {@link VaultIndex} exactly once per
 * lint run.
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
): Promise<VaultIndex | null> {
  if (!config.resolve) return null;
  const root =
    config.vaultRoot !== null && config.vaultRoot !== undefined
      ? config.vaultRoot
      : await deps.detector.detect(startDir);
  return deps.buildIndex(root, { caseSensitive: config.wikilinks.caseSensitive });
}
