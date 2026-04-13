import * as path from "node:path";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";
import { matchWikilink } from "../../../../src/domain/vault/WikilinkMatcher.js";
import type { VaultIndex } from "../../../../src/domain/vault/VaultIndex.js";
import type { WikilinkNode } from "../../../../src/domain/parsing/WikilinkNode.js";

/**
 * Build a tiny in-memory {@link VaultIndex} for unit tests.
 *
 * @param files - Vault-relative `.md` paths (e.g. `"notes/index.md"`).
 * @param options.root - Override vault root. Defaults to a platform-resolved `/v`.
 * @param options.caseSensitive - Resolver behaviour. Defaults to `false`.
 */
export function stubVault(
  files: readonly string[],
  options: { root?: string; caseSensitive?: boolean } = {},
): VaultIndex {
  const root = path.resolve(options.root ?? "/v");
  const caseSensitive = options.caseSensitive ?? false;
  const paths = files.map((rel) => makeVaultPath(root, path.join(root, rel)));
  const byRelative = new Set(paths.map((p) => p.relative));
  return Object.freeze({
    root,
    all: () => paths,
    has: (rel: string) => byRelative.has(rel),
    resolve: (link: Pick<WikilinkNode, "target">) =>
      matchWikilink(link.target, paths, { caseSensitive }),
  });
}
