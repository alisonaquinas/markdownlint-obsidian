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

## Domain Service

### VaultIndex
Built once per LintRun. Resolves wikilink targets to VaultPaths using Obsidian's
own resolution logic: exact match first, then case-insensitive, then basename-only.

```typescript
interface VaultIndex {
  /** Resolve a wikilink target to a VaultPath, or null if not found. */
  resolve(wikilink: WikilinkNode): VaultPath | null;
  /** All .md files in the vault. */
  all(): readonly VaultPath[];
}
```
