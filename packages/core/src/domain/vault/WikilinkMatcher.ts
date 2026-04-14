/**
 * Purpose: Implements Obsidian's wikilink resolution algorithm — exact path, case-insensitive path, then basename — as a pure function against a set of vault files.
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
 * case-insensitive ones (which power OFM005).
 */
export type MatchResult =
  | { kind: "resolved"; path: VaultPath; strategy: "exact" | "case-insensitive" | "basename" }
  | { kind: "ambiguous"; candidates: readonly VaultPath[] }
  | { kind: "not-found" };

export interface MatchOptions {
  readonly caseSensitive: boolean;
}

/**
 * Match a wikilink target against a vault index.
 *
 * Resolution order mirrors Obsidian itself:
 *   1. Exact path match (minus `.md`).
 *   2. Case-insensitive path match (opt-in via `caseSensitive: false`).
 *   3. Basename match against {@link VaultPath.stem}; multiple hits → ambiguous.
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

  return matchByStem(normalizedTarget, files, options);
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
