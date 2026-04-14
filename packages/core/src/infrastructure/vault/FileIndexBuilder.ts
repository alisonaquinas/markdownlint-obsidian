/**
 * Purpose: Scans a vault root for all Markdown files and returns an in-memory VaultIndex.
 *
 * Provides: {@link buildFileIndex}, {@link BuildOptions}
 *
 * Role in system: Entry point for vault discovery used by the CLI bootstrap phase; honours
 * `.gitignore` and always excludes `.obsidian/` and `node_modules/`, then wraps the
 * resulting file list with wikilink resolution logic from the domain's `WikilinkMatcher`.
 *
 * @module infrastructure/vault/FileIndexBuilder
 */
import * as path from "node:path";
import { globby } from "globby";
import type { VaultIndex } from "../../domain/vault/VaultIndex.js";
import { makeVaultPath, type VaultPath } from "../../domain/vault/VaultPath.js";
import { matchWikilink, type MatchResult } from "../../domain/vault/WikilinkMatcher.js";
import type { WikilinkNode } from "../../domain/parsing/WikilinkNode.js";

export interface BuildOptions {
  readonly caseSensitive: boolean;
  readonly ignores?: readonly string[];
}

/**
 * Scan `vaultRoot` for every `.md` file and return an in-memory
 * {@link VaultIndex}.
 *
 * `.obsidian/` and `node_modules/` are always ignored. `.gitignore` is
 * honoured so tooling output never pollutes the index. `ignores` from
 * {@link BuildOptions} extends those defaults.
 */
export async function buildFileIndex(
  vaultRoot: string,
  options: BuildOptions,
): Promise<VaultIndex> {
  const resolvedRoot = path.resolve(vaultRoot);
  const absolutes = await globby(["**/*.md"], {
    cwd: resolvedRoot,
    absolute: true,
    gitignore: true,
    ignore: [...(options.ignores ?? []), "**/.obsidian/**", "**/node_modules/**"],
  });
  const paths: VaultPath[] = absolutes.map((abs) => makeVaultPath(resolvedRoot, abs));
  const byRelative = new Set(paths.map((p) => p.relative));

  return Object.freeze({
    root: resolvedRoot,
    all: () => paths,
    has: (relative: string) => byRelative.has(relative),
    resolve: (link: Pick<WikilinkNode, "target">): MatchResult =>
      matchWikilink(link.target, paths, { caseSensitive: options.caseSensitive }),
  });
}
