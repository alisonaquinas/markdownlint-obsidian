/**
 * Purpose: Defines the branded `VaultRoot` string type and its factory, ensuring callers cannot pass an unvalidated path where a vault root is expected.
 *
 * Provides: {@link VaultRoot}, {@link toVaultRoot}
 *
 * Role in system: Established at the infrastructure boundary after path resolution and propagated into domain services; the nominal brand prevents accidentally passing an arbitrary string as a trusted vault root at compile time.
 *
 * @module domain/vault/VaultRoot
 */

/**
 * Nominal type over `string` that signals "this has been validated as a
 * vault root path". Use {@link toVaultRoot} to brand a raw string at the
 * infrastructure boundary; downstream domain services can then refuse
 * untrusted strings at compile time.
 */
export type VaultRoot = string & { readonly __brand: "VaultRoot" };

/** Brand a boundary-normalised absolute directory as a {@link VaultRoot}. */
export function toVaultRoot(absoluteDir: string): VaultRoot {
  return absoluteDir as VaultRoot;
}
