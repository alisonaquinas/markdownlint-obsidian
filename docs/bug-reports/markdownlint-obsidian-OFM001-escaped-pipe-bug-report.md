# Bug Report — markdownlint-obsidian false-positives on a valid Obsidian vault

**Tool:** `markdownlint-obsidian-cli`
**Repo:** `github.com/alisonaquinas/markdownlint-obsidian`
**Version tested:** `1.1.2` (latest) — also reproduced on `1.1.0`
**Environment:** Node `v25.6.1`, npm `11.11.1`, macOS (Darwin 25.5.0, arm64)
**Date:** 2026-07-07

## Overview

On a real, **valid** Obsidian vault (276 docs), the linter reports **372**
violations, of which **~239** (`182 OFM001` + `57 OFM004`) are false-positives
produced by the two wikilink-resolution issues below. The links render and
resolve correctly in Obsidian. Critically, **there is no way to rewrite the
docs to satisfy the linter** without degrading them, because the standard fix
for an ambiguous link (path-qualification) is itself broken by Issue 2. A third
issue makes `--fix` regress. Net effect: a correct vault cannot pass, and cannot
be made to pass by editing the Markdown.

---

## Issue 1 — OFM001: escaped pipe `\|` not stripped from wikilink target

Inside a Markdown table, an aliased wikilink **must** escape the pipe as `\|`
(a bare `|` ends the table cell); Obsidian renders `[[target\|alias]]`
correctly. The linter keeps the backslash, parsing the target as `` target\ ``.

### Repro

```bash
mkdir -p repro/.git repro/notes && cd repro
printf '# Target\n' > notes/target.md
printf '# I\n\n| N | D |\n|---|---|\n| [[notes/target\\|target.md]] | x |\n' > index.md
npx --yes markdownlint-obsidian-cli@1.1.2 markdownlint-obsidian "**/*.md"
```

**Actual:** `index.md:5:3 OFM001 Broken wikilink: target "notes/target\" not found`
**Expected:** resolves to `notes/target`, display `target.md`.

**Isolation** (target `notes/target.md` exists): `[[notes/target\|a]]` ❌ ·
`[[notes/target|a]]` (unescaped) ✅ · `[[notes/target]]` ✅. Only the escaped
pipe fails — but the escaped form is the only table-legal one.

### Suggested fix

Split the wikilink inner text on the first **unescaped** `|` (treat `\|` as an
escaped literal pipe), or strip a trailing `\` from the target segment before
resolving.

---

## Issue 2 — OFM001/OFM004: vault-relative path targets not resolved (basename-only)

The linter resolves wikilinks by **basename only**; a path-qualified target
`[[dir/note]]` is reported broken even when `dir/note.md` exists. Obsidian
resolves both forms.

### Repro (in a vault containing `docs/entities/authentication.md`)

```text
[[entities/authentication]]   → OFM001 Broken wikilink: target "entities/authentication" not found
[[authentication]]            → resolves (if unique) / OFM004 (if ambiguous)
```

### Why this is the blocking issue

`OFM004` fires when a bare basename is ambiguous (e.g. `authentication` matches
three files). The **documented, Obsidian-correct** way to disambiguate is to
path-qualify: `[[entities/authentication]]`. But Issue 2 makes that resolve to
`OFM001`. **So an ambiguous link has no valid representation the linter
accepts** — not the bare form (OFM004), not the qualified form (OFM001).

In the sample vault this blocks: **297** path-style links (OFM001) and all
**57** ambiguous links (OFM004), including ~38 that target basenames which are
inherently non-unique (`index` matches **25** files, so `[[index]]` can never
be disambiguated by basename).

### Suggested fix

Resolve a target containing `/` as a vault-relative (or shortest-unique) path,
matching Obsidian. This also gives `OFM004` a valid remediation (path-qualify).

---

## Issue 3 — `--fix` introduces new violations and reports conflicts

Running `--fix` on the vault emitted `[fix-conflict] … Overlap on line N`
messages for several files and **introduced** new violations that weren't
present before — notably `MD012` (multiple consecutive blank lines, ×24) and an
`MD025`, while only partially resolving `MD032`. Auto-fix should be idempotent
and must not create violations of other enabled rules.

### Suggested fix

When inserting blank lines (MD022/MD031/MD032 fixers), coalesce with adjacent
blank lines so the result doesn't violate MD012; resolve overlapping fixes
deterministically instead of emitting a conflict and skipping.

---

## Priority

Issues 1 and 2 are the blockers: together they account for the ~239
false-positives and, because of the Issue-2/OFM004 interaction, make the vault
**unfixable from the Markdown side**. Fixing them lets a correct vault pass with
only genuine formatting fixes remaining. Issue 3 is lower priority but makes
`--fix` unsafe to run in CI.
