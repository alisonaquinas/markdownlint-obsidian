---
title: "flavor-grenade-lsp Research"
aliases:
  - "flavor-grenade-lsp Research"
tags:
  - "research/vscode"
  - "research/lsp"
  - "research/flavor-grenade"
  - "docs"
  - "docs/research"
  - "docs/research/flavor-grenade-lsp"
type: "research"
status: "current"
updated: 2026-05-09
up: "[[README]]"
sources:
  - https://github.com/alisonaquinas/flavor-grenade-lsp
  - https://github.com/alisonaquinas/flavor-grenade-lsp/releases/tag/v0.3.0
---

# flavor-grenade-lsp Research

This folder captures verified notes on `alisonaquinas/flavor-grenade-lsp` as a
reference model for a future `markdownlint-obsidian` VS Code extension.

Source snapshot: upstream `main` at
`8f669413a95b2952db34642fa4386e0cc86733e6`, checked on 2026-05-09.

Latest release reviewed: `v0.3.0`, published 2026-05-09. The VS Code
extension manifest on `main` reports version `0.1.4`.

## Recent Update Summary

- Flavor Grenade now has a finalized `ofmarkdown` language contribution with
  grammar, snippets, and command activation bridges.
- Extension startup is gated by commands, vault markers, open file ancestors,
  or existing `ofmarkdown` documents instead of starting unconditionally.
- The extension refuses server startup in Restricted Mode and virtual
  workspaces, and surfaces that disabled state through status UX.
- Command bridges now expose references, follow-link, embed target, backlinks,
  outlinks, vault-root reveal, and diagnostic-info copy flows.
- Extension-host regression, Marketplace evidence, package target checks, and
  Windows binary smoke coverage are part of the upstream release discipline.

## Documents

- [Technical Stack And Architecture](technical-stack-and-architecture.md)
