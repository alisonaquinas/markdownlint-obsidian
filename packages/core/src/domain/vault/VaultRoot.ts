import * as path from "node:path";

/**
 * Nominal type over `string` that signals "this has been validated as a
 * vault root path". Use {@link toVaultRoot} to brand a raw string at the
 * infrastructure boundary; downstream domain services can then refuse
 * untrusted strings at compile time.
 */
export type VaultRoot = string & { readonly __brand: "VaultRoot" };

/** Normalise `absoluteDir` and brand it as a {@link VaultRoot}. */
export function toVaultRoot(absoluteDir: string): VaultRoot {
  const normalized = path.resolve(absoluteDir);
  return normalized as VaultRoot;
}
