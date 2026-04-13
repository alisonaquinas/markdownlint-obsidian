---
adr: 002
title: Wikilink resolution enabled by default
status: accepted
date: 2026-04-11
---

# ADR 002 — Wikilink resolution enabled by default

## Context

Phase 4 introduces wikilink rules (OFM001 broken-wikilink, OFM004
ambiguous-target, OFM005 case-mismatch, OFM007 block-ref). Every one of
these depends on a vault file index. We had two choices:

- **Default off** — users must explicitly opt in. Safer for non-vault
  projects (single markdown files, mixed repos) but means the headline
  feature is invisible until configured.
- **Default on** — rules light up immediately; users opt out via
  `--no-resolve` or `resolve: false` when the repo isn't a vault.

## Decision

Wikilink resolution is on by default. `--no-resolve` and `resolve: false`
give users an escape hatch. Vault root detection walks upward for
`.obsidian/` then falls back to `.git/`; if neither exists the CLI exits 2
with `OFM900`.

## Consequences

- First-run users of `markdownlint-obsidian` on an Obsidian vault see the
  full wikilink rule family with no configuration.
- Repos that are not vaults need one extra flag or config key. The
  `OFM900` error message points users at the option.
- Dogfood runs (this repo's own `docs/` tree) must keep every wikilink
  resolvable or explicitly opt out.

## Related

- [[rules/wikilinks/OFM001]]
- [[adr/ADR001-option-b-standalone]]
- [[adr/ADR003-markdownlint-as-dependency]]
