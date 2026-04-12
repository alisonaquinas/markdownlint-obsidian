---
title: Autofix guide
---

# Autofix

`markdownlint-obsidian` can automatically repair fixable violations in-place. Phase 9 ships two modes:

| Flag | Effect |
|------|--------|
| `--fix` | Apply all safe, non-overlapping fixes and rewrite files atomically |
| `--fix-check` | Dry-run: compute fixes, report what would change, exit 1 if any fix is needed — files are never written |

## Quick start

```bash
# Fix all violations in your vault
markdownlint-obsidian --fix "**/*.md"

# CI gate: fail if any fixable violation is present
markdownlint-obsidian --fix-check "**/*.md"
```

## Fixable rules

| Code | Name | Fix action |
|------|------|-----------|
| OFM063 | tag-trailing-slash | Delete the trailing `/` from inline tags |
| OFM065 | mixed-case-tag | Rewrite the tag with canonical casing |
| OFM086 | frontmatter-trailing-whitespace | Strip trailing whitespace from top-level string values |
| OFM044 | callout-fold-disabled | Remove the stray `+`/`-` fold marker from the callout header |
| OFM104 | block-id-case | Lowercase the block identifier |
| OFM124 | empty-highlight | Delete the empty `====` span |
| OFM005 | wikilink-case-mismatch | Replace the wikilink target with the resolved path casing |

markdownlint's own built-in rules (MD-prefix) also emit fix payloads when supported upstream; these are applied automatically alongside OFM fixes.

## How fixes are applied

1. **First pass** — lint every file; collect `Fix` objects from each violation.
2. **Apply** — for each file, sort fixes end-to-start by column so each deletion does not shift the offsets of earlier fixes. Non-overlapping fixes on the same line are all applied in a single pass.
3. **Write** — the patched content is written atomically via a sibling temp file + rename, so a partial write never corrupts the original.
4. **Second pass** — lint the patched files again and report any remaining violations.

## Conflict detection

Two fixes on the same file that target overlapping character ranges cannot both be applied safely. When a conflict is detected:

- The **first** fix (earlier in source order) is applied.
- The **second** fix is skipped.
- The conflict is reported to stderr as a `[fix-conflict]` message showing the file path and affected line.

In practice, conflicts are rare because each rule owns a distinct part of the syntax it targets.

## Before and after

**Input (`notes/projects.md`):**

```markdown
---
title: "My Notes   "
---

#project/ started today
```

**After `--fix`:**

```markdown
---
title: "My Notes"
---

#project started today
```

Two fixes applied: OFM086 removed trailing whitespace from the `title` value; OFM063 removed the trailing `/` from the inline tag.

## `--fix-check` in CI

```yaml
- name: Check for auto-fixable violations
  run: npx markdownlint-obsidian --fix-check "**/*.md"
  # Exits 1 if any fixable violation is present; forces authors to run --fix locally
```

`--fix-check` reports `Would fix N file(s)` to stderr to tell you exactly which files would be changed.
