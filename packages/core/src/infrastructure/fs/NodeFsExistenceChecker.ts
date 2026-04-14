/**
 * Purpose: Implements the {@link FileExistenceChecker} domain port using Node.js `fs.access`.
 *
 * Provides: {@link makeNodeFsExistenceChecker}
 *
 * Role in system: Infrastructure adapter that fulfils the `fsCheck` dependency injected into
 * lint rules; it confines path resolution strictly within the vault root to prevent
 * path-traversal leaks, and converts any I/O error into a safe `false` return so rules never
 * observe filesystem exceptions.
 *
 * @module infrastructure/fs/NodeFsExistenceChecker
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileExistenceChecker } from "../../domain/fs/FileExistenceChecker.js";

/**
 * Build a {@link FileExistenceChecker} backed by `node:fs`.
 *
 * The checker resolves `relative` beneath `vaultRoot`, refuses any path that
 * escapes the vault root (so `../secrets` returns `false` rather than
 * leaking existence information about files outside the vault), and uses
 * `fs.access` for the existence probe. Any IO error is swallowed and turned
 * into `false`; rules never see filesystem exceptions.
 *
 * Construction is free — the returned object is stateless and can be shared
 * across an entire lint run. One instance is built per CLI invocation in
 * `cli/main.ts` and threaded through {@link RuleParams.fsCheck}.
 */
function resolveWithinRoot(vaultRoot: string, relative: string): string | null {
  if (typeof vaultRoot !== "string" || vaultRoot.length === 0) return null;
  if (typeof relative !== "string" || relative.length === 0) return null;
  const normalized = relative.replace(/\\/g, "/");
  const rootResolved = path.resolve(vaultRoot);
  const absolute = path.resolve(rootResolved, normalized);
  const withinRoot = absolute === rootResolved || absolute.startsWith(rootResolved + path.sep);
  return withinRoot ? absolute : null;
}

export function makeNodeFsExistenceChecker(): FileExistenceChecker {
  return {
    async exists(vaultRoot: string, relative: string): Promise<boolean> {
      const absolute = resolveWithinRoot(vaultRoot, relative);
      if (absolute === null) return false;
      try {
        await fs.access(absolute);
        return true;
      } catch {
        return false;
      }
    },
  };
}
