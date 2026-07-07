/**
 * Purpose: Implements wikilink resolution — exact path, case-insensitive path, optional path suffix, then basename — as a pure function against a set of vault files.
 *
 * Provides: {@link matchWikilink}, {@link MatchResult}, {@link MatchOptions}
 *
 * Role in system: The pure core of wikilink resolution called by {@link VaultIndex.resolve}; keeping the algorithm in the domain means it can be unit-tested without any filesystem setup and reused by any rule that needs to verify link targets.
 *
 * @module domain/vault/WikilinkMatcher
 */
import type { VaultPath } from "./VaultPath.js";

/**
 * Outcome of resolving a wikilink target against a set of candidate files.
 *
 * `strategy` on `resolved` records which of Obsidian's fallback mechanisms
 * actually found the file. Rules use it to distinguish exact matches from
 * case-insensitive ones (which power OFM005). The `path-suffix` strategy
 * is only ever returned when {@link MatchOptions.resolveMode} is
 * `"obsidian-fuzzy"`.
 */
export type MatchResult =
  | {
      kind: "resolved";
      path: VaultPath;
      strategy: "exact" | "case-insensitive" | "path-suffix" | "basename";
    }
  | { kind: "ambiguous"; candidates: readonly VaultPath[] }
  | { kind: "not-found" };

/**
 * Resolution mode for wikilink targets.
 *
 * - `"obsidian-fuzzy"` — adds a path-suffix step between case-insensitive
 *   and basename. Mirrors Obsidian's own algorithm for vaults that mix
 *   vault-absolute (`[[raw/upnote/Note]]`) and folder-implicit
 *   (`[[sources/foo]]`) wikilinks.
 * - `"path-relative"` — exact, case-insensitive (when `caseSensitive` is
 *   false), then basename. Matches the legacy behaviour shipped in 1.0.x.
 *
 * See https://github.com/alisonaquinas/markdownlint-obsidian/issues/27.
 */
export type ResolveMode = "path-relative" | "obsidian-fuzzy";

export interface MatchOptions {
  readonly caseSensitive: boolean;
  readonly resolveMode?: ResolveMode;
}

/**
 * Match a wikilink target against a vault index.
 *
 * Resolution order mirrors Obsidian itself when `resolveMode` is
 * `"obsidian-fuzzy"`:
 *   1. Exact path match (minus `.md`).
 *   2. Case-insensitive path match (opt-in via `caseSensitive: false`).
 *   3. Path-suffix match — `obsidian-fuzzy` mode only — any file whose
 *      relative path ends with `<target>.md` aligned on a `/` boundary.
 *      A unique hit resolves; multiple hits are reported as ambiguous so
 *      OFM004 can surface the conflict instead of an arbitrary winner.
 *   4. Basename match against {@link VaultPath.stem}; multiple hits →
 *      ambiguous.
 */
export function matchWikilink(
  target: string,
  files: readonly VaultPath[],
  options: MatchOptions,
): MatchResult {
  const normalizedTarget = normalize(target);
  if (normalizedTarget === "") return { kind: "not-found" };

  const exact = files.find((f) => stripExt(f.relative) === normalizedTarget);
  if (exact !== undefined) return { kind: "resolved", path: exact, strategy: "exact" };

  if (!options.caseSensitive) {
    const ci = files.find(
      (f) => stripExt(f.relative).toLowerCase() === normalizedTarget.toLowerCase(),
    );
    if (ci !== undefined) return { kind: "resolved", path: ci, strategy: "case-insensitive" };
  }

  if (options.resolveMode === "obsidian-fuzzy") {
    const suffix = matchByPathSuffix(normalizedTarget, files, options);
    if (suffix !== null) return suffix;
  }

  return matchByStem(normalizedTarget, files, options);
}

/**
 * Path-suffix match: a file's POSIX relative path (minus `.md`) ends with
 * the target aligned on a `/` boundary.
 *
 * Aligning on `/` keeps the match conceptual ("the trailing `n` segments
 * of this file's path equal the target") instead of accidentally matching
 * partial path components — `notes/sources/foo.md` resolves
 * `[[sources/foo]]` but `super-sources/foo.md` does not.
 * Bare targets like `[[foo]]` intentionally fall through to basename
 * matching so fuzzy mode does not change the reported resolution strategy.
 *
 * Returns `null` (not `not-found`) when zero candidates match so the
 * caller can fall through to the basename strategy.
 */
function matchByPathSuffix(
  normalizedTarget: string,
  files: readonly VaultPath[],
  options: MatchOptions,
): MatchResult | null {
  if (!normalizedTarget.includes("/")) return null;

  const eq: (a: string, b: string) => boolean = options.caseSensitive
    ? (a: string, b: string): boolean => a === b
    : (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();
  const candidates = files.filter((f) => {
    const stripped = stripExt(f.relative);
    if (eq(stripped, normalizedTarget)) return true;
    if (stripped.length <= normalizedTarget.length) return false;
    const boundary = stripped.length - normalizedTarget.length - 1;
    if (stripped.charAt(boundary) !== "/") return false;
    return eq(stripped.slice(boundary + 1), normalizedTarget);
  });
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    return { kind: "resolved", path: candidates[0]!, strategy: "path-suffix" };
  }
  return { kind: "ambiguous", candidates };
}

function matchByStem(
  normalizedTarget: string,
  files: readonly VaultPath[],
  options: MatchOptions,
): MatchResult {
  const byStem = files.filter((f) =>
    options.caseSensitive
      ? f.stem === normalizedTarget
      : f.stem.toLowerCase() === normalizedTarget.toLowerCase(),
  );
  if (byStem.length === 1) return { kind: "resolved", path: byStem[0]!, strategy: "basename" };
  if (byStem.length > 1) return { kind: "ambiguous", candidates: byStem };
  return { kind: "not-found" };
}

function normalize(target: string): string {
  return target.replace(/\\/g, "/").replace(/\.md$/i, "");
}

function stripExt(relative: string): string {
  return relative.replace(/\.md$/i, "");
}
