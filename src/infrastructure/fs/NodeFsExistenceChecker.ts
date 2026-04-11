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
export function makeNodeFsExistenceChecker(): FileExistenceChecker {
  return {
    async exists(vaultRoot: string, relative: string): Promise<boolean> {
      if (typeof vaultRoot !== "string" || vaultRoot.length === 0) return false;
      if (typeof relative !== "string" || relative.length === 0) return false;
      const normalized = relative.replace(/\\/g, "/");
      const absolute = path.resolve(vaultRoot, normalized);
      const rootResolved = path.resolve(vaultRoot);
      const withinRoot =
        absolute === rootResolved || absolute.startsWith(rootResolved + path.sep);
      if (!withinRoot) return false;
      try {
        await fs.access(absolute);
        return true;
      } catch {
        return false;
      }
    },
  };
}
