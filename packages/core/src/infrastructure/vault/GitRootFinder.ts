/**
 * Purpose: Walks the directory tree upward to locate the nearest `.git/` repository root.
 *
 * Provides: {@link findGitRoot}
 *
 * Role in system: Provides the fallback vault-root detection strategy used by
 * {@link makeNodeFsVaultDetector} when no `.obsidian/` directory is found; accepts both
 * normal `.git` directories and worktree file links so monorepos and git worktrees are
 * handled correctly.
 *
 * @module infrastructure/vault/GitRootFinder
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Walk upward from `startDir` and return the closest ancestor directory
 * containing a `.git/` entry (directory or worktree file).
 *
 * Returns `null` when none is found. Used as a fallback target by
 * {@link makeNodeFsVaultDetector} when `.obsidian/` is absent.
 */
export async function findGitRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  for (;;) {
    try {
      const stat = await fs.stat(path.join(dir, ".git"));
      // `.git` may be either a directory (normal repo) or a regular file
      // (worktree). Either one marks the repo root.
      if (stat.isDirectory() || stat.isFile()) return dir;
    } catch {
      // ENOENT / permission — keep walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
