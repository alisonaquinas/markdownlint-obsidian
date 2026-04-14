/**
 * Purpose: Discovers Markdown files in a directory by expanding glob patterns and honouring ignore rules.
 *
 * Provides: {@link discoverFiles}
 *
 * Role in system: Infrastructure adapter that wraps `globby` to translate the `globs` and
 * `ignores` fields from {@link LinterConfig} into a stable, alphabetically-sorted list of
 * absolute file paths supplied to the application-layer use cases.
 *
 * @module infrastructure/discovery/FileDiscovery
 */
import { globby } from "globby";

/**
 * Discover files matching `globs`, excluding paths that match `ignores`.
 *
 * Honours `.gitignore` by default and returns absolute paths sorted
 * alphabetically so callers observe a stable order.
 *
 * @param globs - Glob patterns to include (e.g. `["**\/*.md"]`).
 * @param ignores - Glob patterns to exclude (e.g. `["node_modules/**"]`).
 * @param cwd - Base directory for glob resolution.
 * @returns Sorted array of absolute file paths.
 */
export async function discoverFiles(
  globs: readonly string[],
  ignores: readonly string[],
  cwd: string,
): Promise<string[]> {
  const patterns = [...globs, ...ignores.map((p) => `!${p}`)];

  const files = await globby(patterns, {
    cwd,
    absolute: true,
    gitignore: true,
    dot: false,
  });

  return files.sort();
}
