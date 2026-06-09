---
title: "Wikilink resolution modes"
aliases:
  - "Wikilink resolution modes"
tags:
  - "docs"
  - "docs/guides"
type: "guide"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Wikilink resolution modes

`markdownlint-obsidian` supports two strategies for resolving `[[wikilink]]`
targets against the vault file index. Pick one with the
`wikilinks.resolveMode` config key.

## `path-relative` (default)

Conservative resolution that matches the behaviour shipped through 1.0.x:

1. **Exact path match** — `[[notes/index]]` resolves only if
   `notes/index.md` exists at the vault root.
2. **Case-insensitive path match** (when `wikilinks.caseSensitive` is
   `false`) — `[[Notes/Index]]` resolves to `notes/index.md` if it exists,
   and OFM005 reports the case mismatch.
3. **Basename match** — `[[index]]` resolves if exactly one file in the
   vault has stem `index`. Multiple candidates trigger OFM004 (ambiguous
   target).

This mode is right for vaults whose links are always written
vault-absolute. It is the safest default because it never has to
disambiguate between multiple suffix matches.

## `obsidian-fuzzy`

Mirrors Obsidian's own algorithm. Inserts a **path-suffix** step between
the case-insensitive and basename strategies:

1. Exact path match.
2. Case-insensitive path match.
3. **Path-suffix match** — any file whose POSIX relative path (minus
   `.md`) ends with the target aligned on a `/` boundary. So
   `[[sources/foo]]` resolves to `wiki/sources/foo.md`, and
   `[[Some Note]]` keeps falling through to the basename step.
4. Basename match.

Boundary alignment keeps the match conceptual: the trailing _n_ path
segments of the candidate equal the target. `super-sources/foo.md` is
**not** a valid match for `[[sources/foo]]`.

Path-suffix matching only applies to path-like targets containing `/`. Bare
targets like `[[foo]]` are still basename matches, even in `obsidian-fuzzy`
mode.

When more than one file ends with the same suffix, the result is
`ambiguous` so OFM004 surfaces the conflict instead of an arbitrary
winner.

### When to enable it

Vaults that mix two link styles in the same file:

- **Vault-absolute** — `[[raw/upnote/My Note]]` resolves to
  `<vault-root>/raw/upnote/My Note.md`.
- **Folder-implicit** — `[[sources/foo]]` resolves via path-suffix to
  any file whose path ends with `sources/foo.md`.

The Karpathy-style "LLM Wiki" pattern (a `wiki/` folder of synthesis
pages alongside `raw/`, `assets/`, etc., all under one Obsidian vault) is
the canonical case. Without `obsidian-fuzzy`, neither `--vault-root .`
nor `--vault-root wiki` produces correct OFM001/OFM004 results — one
breaks the absolute links and the other breaks the folder-implicit ones.

### Configuration

```jsonc
{
  "wikilinks": {
    "caseSensitive": false,
    "allowAlias": true,
    "resolveMode": "obsidian-fuzzy"
  }
}
```

### Related

- [[OFM001]] (broken wikilink)
- [[OFM004]] (ambiguous target)
- [[OFM005]] (case mismatch)
