---
title: "VS Code Extension Documentation"
aliases:
  - "VS Code Extension Documentation"
  - "Index"
tags:
  - "extension-docs"
type: "moc"
status: "current"
updated: 2026-05-09
---

# VS Code Extension Documentation

Planning, implementation, and release reference wiki for the
`markdownlint-obsidian` VS Code extension.

This tree is intentionally separate from root `docs/`. Root docs describe the
core linter, CLI, GitHub Action, rules, and project architecture. Extension docs
describe editor integration: activation, diagnostics, settings, commands,
language modes, packaging, tests, and release behavior.

> [!INFO] Extension vault map
> Start with [[roadmap]], [[architecture/overview]], [[requirements/index]], [[ddd/README]], [[bdd/README]], and [[tests/README]].

## Index

| Directory / File | Contents |
| :--- | :--- |
| [[architecture/overview]] | Extension architecture, boundaries, and data flow |
| [[bdd/README]] | Behavior-domain scenarios and traceability |
| [[ddd/README]] | Extension bounded contexts and ubiquitous language |
| [[requirements/index]] | User and functional requirements for the extension |
| [[tests/README]] | Unit, verification, validation, and automation test plans |
| [[roadmap]] | Extension implementation roadmap and phase gates |
| [[plans/index]] | Extension delivery plans and execution notes |
| [[research/index]] | Supporting research for extension decisions |
| [[adr/index]] | Extension-specific Architecture Decision Records |

## Implemented Scope

The extension provides VS Code feedback for the existing
`markdownlint-obsidian` library without duplicating lint rules in editor code.
The extension bundles that library as its lint engine dependency. Users do not
need to install the CLI globally or in their workspace for editor diagnostics,
fixes, previews, or workspace commands. The extension depends on the Flavor
Grenade LSP extension for OFMarkdown language detection, then lints documents
that Flavor Grenade has promoted to the `ofmarkdown`
language id.

The implemented editor experience follows the `markdownlint-cli2` style while
using a technology stack and document-selection model closer to
`flavor-grenade-lsp`:

- TypeScript VS Code extension client.
- Clear boundary between editor UI and lint engine behavior.
- Bundled `markdownlint-obsidian` library runtime, not a user-installed CLI.
- Live diagnostics for `ofmarkdown` documents.
- Installed extension dependency on `alisonaquinas.flavor-grenade-lsp`.
- Commands for linting workspace content, applying fixes, opening config, and
  showing output.
- Settings that mirror stable CLI and core options.
- Explicit workspace trust and virtual workspace posture.
- Packaging and test workflows that can run in CI.

## Runtime Shape

Flavor Grenade owns OFMarkdown language-mode detection. The extension runtime
calls the bundled `markdownlint-obsidian` library through public APIs. The
current runtime shape is:

- keep the first implementation in-process;
- preserve core ownership of lint behavior through a thin library adapter;
- do not shell out to `markdownlint-obsidian-cli` or require it to be installed;
- choose an LSP boundary if live diagnostics, workspace indexing, or future
  cross-document editor features need persistent server state.

See [[architecture/flavor-grenade-dependency]].

## Contributing

- Keep extension-specific docs here.
- Link to root docs instead of copying rule reference text.
- Keep research source-backed and dated.
- Run `bun run test:dogfood:extension-docs` before commit. The aggregate
  `bun run test:dogfood` runs both root docs and extension docs.
