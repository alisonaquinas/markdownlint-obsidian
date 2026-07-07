---
title: "Wikilink resolution modes"
aliases:
  - "Wikilink resolution modes"
tags:
  - "docs"
  - "docs/guides"
type: "guide"
status: "current"
updated: 2026-07-07
up: "[[README]]"
---

# Wikilink resolution modes

`markdownlint-obsidian` supports two strategies for resolving `[[wikilink]]`
targets against the vault file index. Pick one with the
`wikilinks.resolveMode` config key.

## `obsidian-fuzzy` (default)

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
targets like `[[foo]]` are still basename matches.

When more than one file ends with the same suffix, the result is
`ambiguous` so OFM004 surfaces the conflict instead of an arbitrary
winner.

This is the default because it matches valid Obsidian links in vaults that
mix two link styles in the same file:

- **Vault-absolute** — `[[raw/upnote/My Note]]` resolves to
  `<vault-root>/raw/upnote/My Note.md`.
- **Folder-implicit** — `[[sources/foo]]` resolves via path-suffix to
  any file whose path ends with `sources/foo.md`.

The Karpathy-style "LLM Wiki" pattern (a `wiki/` folder of synthesis
pages alongside `raw/`, `assets/`, etc., all under one Obsidian vault) is
the canonical case.

## `path-relative`

Legacy conservative resolution that matches the behaviour shipped through
1.0.x:

1. **Exact path match** — `[[notes/index]]` resolves only if
   `notes/index.md` exists at the vault root.
2. **Case-insensitive path match** (when `wikilinks.caseSensitive` is
   `false`) — `[[Notes/Index]]` resolves to `notes/index.md` if it exists,
   and OFM005 reports the case mismatch.
3. **Basename match** — `[[index]]` resolves if exactly one file in the
   vault has stem `index`. Multiple candidates trigger OFM004 (ambiguous
   target).

Use this mode only when you want the older, stricter behaviour and all links
are written vault-absolute or as bare basenames.

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
