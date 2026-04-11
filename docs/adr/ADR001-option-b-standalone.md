---
adr: 001
title: Standalone CLI over plugin or layered distribution
status: accepted
date: 2026-04-11
---

# ADR 001 — Standalone CLI (Option B)

## Context

We evaluated three distribution shapes for `markdownlint-obsidian`:

- **Option A** — an Obsidian plugin that runs inside the editor.
- **Option B** — a standalone Node CLI packaged for CI.
- **Option C** — a layered library embedded in another markdownlint host.

CI integration was the primary user story. Option A requires Obsidian to be
installed on the CI runner; Option C requires users to manage a second
toolchain. Option B gives us full control over the exit-code contract and
the file-discovery pipeline, and composes trivially with GitHub Actions,
pre-commit hooks, and Docker images.

## Decision

Ship a standalone Node CLI (Option B). The entry point is
`bin/markdownlint-obsidian.js`, authored in TypeScript and loaded via the
`tsx` loader in dev / compiled to ESM for distribution.

## Consequences

- CI users install a single package with no external runtime.
- Obsidian plugin users are secondary and must wrap the CLI themselves.
- Future phases can grow vault-specific features without needing to reach
  into Obsidian APIs.

## Related

- [[rules/index]]
- [[adr/ADR002-wikilink-resolution-default-on]]
- [[adr/ADR003-markdownlint-as-dependency]]
