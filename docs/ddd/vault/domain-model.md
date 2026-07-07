---
title: "Vault Domain Model"
aliases:
  - "Vault Domain Model"
tags:
  - "docs"
  - "docs/ddd"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-07-07
up: "[[ddd/bounded-contexts]]"
---

# Vault Domain Model

## Value Objects

### VaultPath

Immutable. A normalized, vault-root-relative path to a `.md` file.

```typescript
interface VaultPath {
  readonly relative: string;   // "notes/project/index.md"
  readonly absolute: string;   // "/home/user/vault/notes/project/index.md"
  readonly stem: string;       // "index" (filename without extension)
}
```

### WikilinkNode

Immutable. A parsed wikilink extracted from a file.

```typescript
interface WikilinkNode {
  readonly target: string;       // "project/index" or "index"
  readonly alias: string | null; // display text after |
  readonly heading: string | null; // after #
  readonly blockRef: string | null; // after ^
  readonly line: number;
  readonly column: number;
  readonly isEmbed: boolean;     // true for ![[...]]
}
```

### MatchResult

Immutable. The outcome of resolving a wikilink target against the vault index.

```typescript
type MatchResult =
  | {
      kind: "resolved";
      path: VaultPath;
      strategy: "exact" | "case-insensitive" | "path-suffix" | "basename";
    }
  | { kind: "ambiguous"; candidates: readonly VaultPath[] }
  | { kind: "not-found" };
```

## Domain Service

### VaultIndex

Built once per LintRun. Resolves wikilink targets to VaultPaths with a
configured resolution mode.

`obsidian-fuzzy` mode is the default and matches Obsidian-style path-suffix
resolution:

1. Exact path match.
2. Case-insensitive path match when `wikilinks.caseSensitive` is `false`.
3. Path-suffix match for path-like targets such as `sources/foo`.
4. Basename match for bare targets such as `foo`.

`path-relative` mode keeps the legacy behavior shipped through 1.0.x:

1. Exact path match.
2. Case-insensitive path match when `wikilinks.caseSensitive` is `false`.
3. Basename match.

The path-suffix step only applies when the target contains `/`. This keeps
bare wikilinks on the basename strategy while still allowing folder-implicit
targets like `[[sources/foo]]` to resolve to `wiki/sources/foo.md`.

```typescript
interface VaultIndex {
  /** Resolve a wikilink target to a concrete match, ambiguity, or miss. */
  resolve(wikilink: Pick<WikilinkNode, "target">): MatchResult;
  /** All .md files in the vault. */
  all(): readonly VaultPath[];
}
```
