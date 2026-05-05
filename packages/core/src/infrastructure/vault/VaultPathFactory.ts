/**
 * Purpose: Converts platform-native filesystem paths into pure domain VaultPath values.
 *
 * Provides: {@link makeNodeVaultPath}
 *
 * Role in system: Keeps Node.js path resolution at the infrastructure boundary
 * while the domain layer works with already-normalised strings.
 *
 * @module infrastructure/vault/VaultPathFactory
 */
import * as path from "node:path";
import { makeVaultPath, type VaultPath } from "../../domain/vault/VaultPath.js";

export function makeNodeVaultPath(vaultRoot: string, absolute: string): VaultPath {
  const normalizedRoot = path.resolve(vaultRoot);
  const normalizedAbs = path.resolve(absolute);
  const relative = path.relative(normalizedRoot, normalizedAbs);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`VaultPath: "${absolute}" is outside vault root "${vaultRoot}"`);
  }
  return makeVaultPath(relative.split(path.sep).join("/"), normalizedAbs);
}
