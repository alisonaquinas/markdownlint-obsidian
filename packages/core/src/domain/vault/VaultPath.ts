import * as path from "node:path";

/**
 * Immutable identity of a single markdown file inside a vault.
 *
 * `relative` is always in POSIX form (`/`-separated) so rule matchers can use
 * naive string comparison regardless of the host OS. `absolute` retains the
 * platform-native form so it round-trips through `path` APIs.
 */
export interface VaultPath {
  readonly relative: string;
  readonly absolute: string;
  readonly stem: string;
}

/**
 * Construct a {@link VaultPath} from an absolute vault root and an absolute
 * file path inside it.
 *
 * @throws Error when `absolute` resolves outside `vaultRoot`.
 */
export function makeVaultPath(vaultRoot: string, absolute: string): VaultPath {
  const normalizedRoot = path.resolve(vaultRoot);
  const normalizedAbs = path.resolve(absolute);
  const rel = path.relative(normalizedRoot, normalizedAbs);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`VaultPath: "${absolute}" is outside vault root "${vaultRoot}"`);
  }
  const forward = rel.split(path.sep).join("/");
  return Object.freeze({
    relative: forward,
    absolute: normalizedAbs,
    stem: path.basename(forward, path.extname(forward)),
  });
}
