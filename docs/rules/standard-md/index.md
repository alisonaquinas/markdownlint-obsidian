---
title: "Standard markdownlint rules"
aliases:
  - "Standard markdownlint rules"
tags:
  - "docs"
  - "docs/rules"
  - "docs/rules/standard-md"
type: "rule-reference"
status: "current"
updated: 2026-05-09
up: "[[rules/index]]"
area: standard-md
---

# Standard markdownlint rules

Phase 7 adopts the upstream [`markdownlint`](https://github.com/DavidAnson/markdownlint)
rule set wholesale. Every `MD001`–`MD049` rule is registered as a first-class
`OFMRule` and participates in the same pipeline as the Obsidian-specific
`OFM001`–`OFM124` rules.

Each entry below links to the upstream documentation for the full
explanation. Rules marked **disabled** collide with OFM syntax and ship
disabled-by-default; see the conflict page for the rationale and how to
re-enable the rule if you need it.

The source of truth for disabled standard-MD conflict defaults is
`packages/core/src/infrastructure/rules/standard/OFM_MD_CONFLICTS.ts`.
`DEFAULT_CONFIG.rules` derives its MD-prefixed disabled entries from that list,
and the adapter translates those entries into upstream markdownlint
configuration before linting.

## Quick reference

| Code  | Name                         | Default   | OFM conflict note                  |
| ----- | ---------------------------- | --------- | ---------------------------------- |
| MD001 | heading-increment            | enabled   | —                                  |
| MD003 | heading-style                | enabled   | —                                  |
| MD004 | ul-style                     | enabled   | —                                  |
| MD005 | list-indent                  | enabled   | —                                  |
| MD007 | ul-indent                    | enabled   | —                                  |
| MD009 | no-trailing-spaces           | enabled   | —                                  |
| MD010 | no-hard-tabs                 | enabled   | —                                  |
| MD011 | no-reversed-links            | enabled   | —                                  |
| MD012 | no-multiple-blanks           | enabled   | —                                  |
| MD013 | line-length                  | **disabled** | [[MD013]]                       |
| MD014 | commands-show-output         | enabled   | —                                  |
| MD018 | no-missing-space-atx         | **disabled** | [[MD018]]                       |
| MD019 | no-multiple-space-atx        | enabled   | —                                  |
| MD020 | no-missing-space-closed-atx  | enabled   | —                                  |
| MD021 | no-multiple-space-closed-atx | enabled   | —                                  |
| MD022 | blanks-around-headings       | enabled   | —                                  |
| MD023 | heading-start-left           | enabled   | —                                  |
| MD024 | no-duplicate-heading         | enabled   | —                                  |
| MD025 | single-title                 | enabled   | —                                  |
| MD026 | no-trailing-punctuation      | enabled   | —                                  |
| MD027 | no-multiple-space-blockquote | enabled   | —                                  |
| MD028 | no-blanks-blockquote         | **disabled** | [[MD028]]                       |
| MD029 | ol-prefix                    | enabled   | —                                  |
| MD030 | list-marker-space            | enabled   | —                                  |
| MD031 | blanks-around-fences         | enabled   | —                                  |
| MD032 | blanks-around-lists          | enabled   | —                                  |
| MD033 | no-inline-html               | **disabled** | [[MD033]]                       |
| MD034 | no-bare-urls                 | **disabled** | [[MD034]]                       |
| MD035 | hr-style                     | enabled   | —                                  |
| MD036 | no-emphasis-as-heading       | enabled   | —                                  |
| MD037 | no-space-in-emphasis         | enabled   | —                                  |
| MD038 | no-space-in-code             | enabled   | —                                  |
| MD039 | no-space-in-links            | enabled   | —                                  |
| MD040 | fenced-code-language         | enabled   | —                                  |
| MD041 | first-line-heading           | **disabled** | [[MD041]]                       |
| MD042 | no-empty-links               | **disabled** | [[MD042]]                       |
| MD043 | required-headings            | enabled   | —                                  |
| MD044 | proper-names                 | enabled   | —                                  |
| MD045 | no-alt-text                  | enabled   | —                                  |
| MD046 | code-block-style             | enabled   | —                                  |
| MD047 | single-trailing-newline      | enabled   | —                                  |
| MD048 | code-fence-style             | enabled   | —                                  |
| MD049 | emphasis-style               | enabled   | —                                  |

Upstream docs: <https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md>

## How markdownlint runs under the adapter

Every MD rule wraps the same `MarkdownLintAdapter`, which memoizes results
per `(filePath, contentHash)`. The upstream library executes at most once
per file per lint pass regardless of how many MD rules are enabled, so
turning every rule on only pays one markdownlint cost per file.

Rule configuration still flows through your standard
`.obsidian-linter.jsonc`. The `rules` block is deep-merged with built-in
defaults, so changing one rule does not discard disabled defaults for other OFM
conflicts. Use the `rules` block:

```jsonc
{
  "rules": {
    // Re-enable MD013 with a wider limit.
    "MD013": { "enabled": true, "options": { "line_length": 120 } },

    // Turn an enabled-by-default rule off.
    "MD024": { "enabled": false }
  }
}
```

`options` are forwarded verbatim to markdownlint — consult the upstream
rule docs for the full option shapes.

## Fix payload compatibility

Upstream markdownlint rules can emit autofix metadata. Most fixes translate
directly into the `markdownlint-obsidian` `Fix` model and are applied by
`--fix` / `--fix-check`.

One upstream shape is intentionally not translated: `fixInfo.deleteCount = -1`.
Markdownlint uses that value as a sentinel for deleting an entire line,
including its trailing newline. The `markdownlint-obsidian` fix model is
single-line and column-based with a non-negative `deleteCount`, so whole-line
deletion cannot be represented without a separate operation.

When an MD rule emits that sentinel, the adapter reports the underlying MD
violation without an attached fix. This preserves the actionable diagnostic
and avoids misreporting the run as `OFM901: Fix.deleteCount must be >= 0`.
Known upstream rules that use this sentinel include MD012 and MD053.
