---
adr: 003
title: Import markdownlint as a library for MD001-MD049
status: accepted
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

## Related

- [[adr/ADR001-option-b-standalone]]
- [[adr/ADR002-wikilink-resolution-default-on]]
- [[plans/phase-07-standard-md]]
