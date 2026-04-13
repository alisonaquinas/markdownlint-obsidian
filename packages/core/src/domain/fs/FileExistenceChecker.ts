/**
 * DIP boundary for checking whether an asset file exists beneath the vault
 * root. The {@link VaultIndex} only tracks `.md` files; embedded assets
 * (images, PDFs, audio, video) need the real filesystem. Rules never import
 * `node:fs` directly — they call this interface and the infrastructure layer
 * supplies an implementation.
 *
 * The contract is intentionally narrow: it takes two plain strings (vault
 * root and a vault-relative path) so the interface itself has zero coupling
 * to any filesystem library. This keeps the domain layer testable with a
 * trivial stub.
 */
export interface FileExistenceChecker {
  /**
   * Return `true` if a file exists at `relative` beneath `vaultRoot`.
   * `relative` uses forward slashes regardless of platform. Implementations
   * MUST refuse paths that escape the vault root (e.g. `../secrets`) by
   * returning `false` rather than throwing.
   *
   * @param vaultRoot - Absolute path to the vault root.
   * @param relative - Vault-relative path with forward slashes.
   * @returns `true` when the file exists and resolves beneath `vaultRoot`.
   */
  exists(vaultRoot: string, relative: string): Promise<boolean>;
}
