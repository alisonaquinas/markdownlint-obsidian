---
title: "Import markdownlint as a library for MD001-MD049"
aliases:
  - "Import markdownlint as a library for MD001-MD049"
tags:
  - "docs"
  - "docs/adr"
type: "adr"
status: "accepted"
updated: 2026-05-09
up: "[[README]]"
adr: 003
date: 2026-04-11
---

# ADR 003 — markdownlint as a library dependency

## Context

Obsidian Flavored Markdown is a superset of CommonMark plus GitHub
Flavored Markdown. Users writing in a vault still want the full
markdownlint rule set (MD001-MD049) alongside the OFM-specific rules.
Reimplementing those 49 rules in this repo is a multi-year effort and
would duplicate well-maintained upstream work.

## Decision

Phase 7 imports the `markdownlint` npm package as a runtime dependency
and exposes its rules through the same rule registry used by OFM rules.
Conflicting rules (e.g. MD033 no-inline-html versus Obsidian's callout
markup) are documented and disabled by default.

## Consequences

- Users get one tool with one config format for both rule families.
- The rule registry must tolerate two different rule authoring styles
  (markdownlint's and ours).
- Upgrading markdownlint requires re-verifying the conflict list.

## 2026-05-04 clarification: OFM conflict defaults

Standard `MDxxx` rules that conflict with OFM syntax remain registered. The
default config disables them through the curated
`OFM_MD_CONFLICTS.ts` list rather than by removing them from the registry. This
keeps the upstream rules available for vaults that explicitly re-enable them.

MD028 (`no-blanks-blockquote`) is part of that conflict list because
multi-paragraph OFM callouts use blockquote containers, and blank separators are
part of the rendering contract. The adapter must translate
`DEFAULT_CONFIG.rules.MD028.enabled === false` into markdownlint configuration
`{ MD028: false }`; user config may still opt back in with
`{ "rules": { "MD028": { "enabled": true } } }`.

The `rules` config branch is deep-merged so a user override for one MD rule does
not erase the default disables for other OFM conflicts.

## Related

- [[adr/ADR001-option-b-standalone]]
- [[adr/ADR002-wikilink-resolution-default-on]]
- [[plans/phase-07-standard-md]]
- [[plans/issue-26-md028-default-disable]]
