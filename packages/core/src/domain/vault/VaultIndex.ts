/**
 * Purpose: Defines the in-memory index of all Markdown files in an Obsidian vault, used for wikilink resolution.
 *
 * Provides: {@link VaultIndex}
 *
 * Role in system: Built once per lint run by the application bootstrap and passed to every rule via {@link RuleParams.vault}. Rules call `resolve()` to turn a {@link WikilinkNode} target into a concrete {@link VaultPath} (or an ambiguous/not-found result) without touching the filesystem directly.
 *
 * @module domain/vault/VaultIndex
 */
import type { VaultPath } from "./VaultPath.js";
import type { WikilinkNode } from "../parsing/WikilinkNode.js";
import type { MatchResult } from "./WikilinkMatcher.js";

/**
 * In-memory index of every `.md` file in a vault.
 *
 * Built once per lint run by {@link bootstrapVault} and passed to every rule
 * via `RuleParams.vault`. Rules resolve wikilink targets through
 * {@link VaultIndex.resolve}; `null` is passed when `config.resolve === false`,
 * so rules must guard on that case before dereferencing.
 */
export interface VaultIndex {
  readonly root: string;
  readonly all: () => readonly VaultPath[];
  readonly has: (relative: string) => boolean;
  readonly resolve: (link: Pick<WikilinkNode, "target">) => MatchResult;
}
