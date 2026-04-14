/**
 * Purpose: Defines the domain interface for detecting the Obsidian vault root directory from an arbitrary starting path.
 *
 * Provides: {@link VaultDetector}
 *
 * Role in system: A Dependency Inversion Point used by the application bootstrap — the infrastructure layer supplies an implementation that walks up the directory tree looking for `.obsidian/` or `.git/`, while the domain stays free of any filesystem coupling.
 *
 * @module domain/vault/VaultDetector
 */

/**
 * Resolves the physical vault root for a lint run.
 *
 * Implementations walk upward from `startDir` looking for an `.obsidian/`
 * directory, fall back to the closest `.git/` directory, and throw an
 * `OFM900`-prefixed error when neither exists.
 */
export interface VaultDetector {
  detect(startDir: string): Promise<string>;
}
