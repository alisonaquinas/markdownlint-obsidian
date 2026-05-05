/**
 * Purpose: Defines the immutable value object representing the identity of a single Markdown file within a vault.
 *
 * Provides: {@link VaultPath}, {@link makeVaultPath}
 *
 * Role in system: The canonical file reference used throughout the domain and application layers — stored in {@link VaultIndex}, embedded in {@link MatchResult}, and used by rules to compare paths without platform-path concerns.
 *
 * @module domain/vault/VaultPath
 */

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
 * Construct a {@link VaultPath} from boundary-normalised path fields.
 *
 * @throws Error when `relative` is empty or attempts to escape the vault.
 */
export function makeVaultPath(relative: string, absolute: string): VaultPath {
  const normalizedRelative = relative.replace(/\\/g, "/");
  if (
    normalizedRelative === "" ||
    normalizedRelative.startsWith("../") ||
    normalizedRelative === ".." ||
    normalizedRelative.startsWith("/")
  ) {
    throw new Error(`VaultPath: invalid vault-relative path "${relative}"`);
  }
  return Object.freeze({
    relative: normalizedRelative,
    absolute,
    stem: stemOf(normalizedRelative),
  });
}

function stemOf(relative: string): string {
  const basename = relative.slice(relative.lastIndexOf("/") + 1);
  const dot = basename.lastIndexOf(".");
  return dot <= 0 ? basename : basename.slice(0, dot);
}
