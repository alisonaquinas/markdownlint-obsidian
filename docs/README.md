# Documentation

Long-form reference and design documentation for `markdownlint-obsidian`.

## Index

| Directory / File | Contents |
| :--- | :--- |
| [rules/](rules/index.md) | Per-rule reference for every OFM and standard-MD override rule |
| [guides/](guides/) | Task-oriented guides for users and integrators |
| [adr/](adr/) | Architecture Decision Records |
| [ddd/](ddd/) | Domain model, bounded contexts, ubiquitous language |
| [plans/](plans/) | Phase execution plans and the delivery ledger |
| [bdd/](bdd/) | Acceptance features and step definitions used by the smoke suite |
| [research/](research/) | Working research notes that informed implementation changes |
| [superpowers/](superpowers/) | Design specs and implementation plans for agent workflows |
| [assets/](assets/) | Brand assets — logo variants, icon files |
| [roadmap.md](roadmap.md) | High-level phased delivery roadmap |

## Guides

| Guide | Audience |
| :--- | :--- |
| [install.md](guides/install.md) | First-time setup |
| [ci-integration.md](guides/ci-integration.md) | GitHub Actions, GitLab CI, Jenkins, Azure Pipelines |
| [autofix.md](guides/autofix.md) | Using `--fix` and `--fix-check` |
| [custom-rules.md](guides/custom-rules.md) | Authoring custom OFM rules |
| [public-api.md](guides/public-api.md) | Programmatic API reference |

## Architecture Decision Records

ADRs are numbered sequentially. Each records the context, options considered,
decision made, and consequences.

| ADR | Title |
| :--- | :--- |
| [ADR001](adr/ADR001-option-b-standalone.md) | Standalone package (option B) |
| [ADR002](adr/ADR002-wikilink-resolution-default-on.md) | Wikilink resolution on by default |
| [ADR003](adr/ADR003-markdownlint-as-dependency.md) | markdownlint as a dependency |
| [ADR004](adr/ADR004-ofm-regex-over-plugins.md) | OFM regex over markdown-it plugins |
| [ADR005](adr/ADR005-node-path-in-domain.md) | Node path in the domain |
| [ADR006](adr/ADR006-package-split.md) | Core / CLI package split |
| [ADR007](adr/ADR007-multi-registry.md) | Multi-registry CD |

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
