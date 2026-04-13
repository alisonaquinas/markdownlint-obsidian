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
