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
