import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { VaultDetector } from "../../domain/vault/VaultDetector.js";
import { findGitRoot } from "./GitRootFinder.js";

/**
 * Filesystem-backed {@link VaultDetector}.
 *
 * Detection order:
 *   1. Walk up `startDir` looking for an `.obsidian/` directory.
 *   2. Fall back to {@link findGitRoot} (closest `.git/`).
 *   3. Throw `OFM900` when neither exists.
 */
export function makeNodeFsVaultDetector(): VaultDetector {
  return {
    async detect(startDir: string): Promise<string> {
      const obsidian = await findObsidianRoot(startDir);
      if (obsidian !== null) return obsidian;
      const git = await findGitRoot(startDir);
      if (git !== null) return git;
      throw new Error(
        `OFM900: no vault root found — no .obsidian/ or .git/ above ${path.resolve(startDir)}`,
      );
    },
  };
}

async function findObsidianRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  for (;;) {
    try {
      const stat = await fs.stat(path.join(dir, ".obsidian"));
      if (stat.isDirectory()) return dir;
    } catch {
      // ENOENT — keep walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
