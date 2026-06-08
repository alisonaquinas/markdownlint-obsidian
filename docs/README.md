---
title: "Documentation"
tags:
  - "docs"
type: "moc"
status: "current"
updated: 2026-05-09
---

# Documentation

Long-form reference and design documentation for `markdownlint-obsidian`.

> [!INFO] Vault map
> Start with [[roadmap]], [[rules/index|rule catalog]], [[guides/install|install]], and [[architecture/README|architecture policy]]. VS Code extension design lives in [extension/docs](../extension/docs/README.md).

## Index

| Directory / File | Contents |
| :--- | :--- |
| [[rules/index]] | Per-rule reference for every OFM and standard-MD override rule |
| [[guides/install]] | Task-oriented guides for users and integrators |
| [[adr/ADR001-option-b-standalone]] | Architecture Decision Records |
| [[architecture/README]] | Binding architecture policies for source, docs, tests, and tooling |
| [[ddd/bounded-contexts]] | Domain model, bounded contexts, ubiquitous language |
| [[requirements/index]] | Stable product and compatibility requirements |
| [[plans/execution-ledger]] | Phase execution plans and the delivery ledger |
| [[audits/config-format-parity-audit-2026-05-09]] | Latest configuration format parity audit |
| [bdd/](bdd/) | Acceptance features and step definitions used by the smoke suite |
| [[research/markdownlint-cli2-config-loading-analysis]] | Working research notes that informed implementation changes |
| [[superpowers/specs/2026-04-11-markdownlint-obsidian-design]] | Design specs and implementation plans for agent workflows |
| [assets/](assets/) | Brand assets — logo variants, icon files |
| [[roadmap]] | High-level phased delivery roadmap |
| [../extension/docs/](../extension/docs/README.md) | VS Code extension architecture, requirements, tests, and plans |

## Guides

| Guide | Audience |
| :--- | :--- |
| [[guides/install]] | First-time setup |
| [[guides/ci-integration]] | GitHub Actions, GitLab CI, Jenkins, Azure Pipelines |
| [[guides/autofix]] | Using `--fix` and `--fix-check` |
| [[guides/custom-rules]] | Authoring custom OFM rules |
| [[guides/public-api]] | Programmatic API reference |

## Architecture Decision Records

ADRs are numbered sequentially. Each records the context, options considered,
decision made, and consequences.

| ADR | Title |
| :--- | :--- |
| [[adr/ADR001-option-b-standalone]] | Standalone package (option B) |
| [[adr/ADR002-wikilink-resolution-default-on]] | Wikilink resolution on by default |
| [[adr/ADR003-markdownlint-as-dependency]] | markdownlint as a dependency |
| [[adr/ADR004-ofm-regex-over-plugins]] | OFM regex over markdown-it plugins |
| [[adr/ADR005-node-path-in-domain]] | Node path in the domain |
| [[adr/ADR006-package-split]] | Core / CLI package split |
| [[adr/ADR007-multi-registry]] | Multi-registry CD |

## Contributing to docs

- Rule docs live alongside rule code. When adding a rule, add its doc at
  `docs/rules/<family>/OFMxxx.md`.
- Guides are user-facing. Keep examples runnable and up to date with the
  current CLI flags and config schema.
- ADRs are append-only. Never edit a ratified ADR — add a superseding one.
- The `plans/` directory is a historical record. Plans are not updated once
  a phase ships; the `execution-ledger.md` tracks actual vs. planned.
- The `research/` and `superpowers/` trees are supporting material. Prefer
  linking to the stable guides and rule docs when you need consumer-facing
  instructions.
