---
title: "Extension DDD"
aliases:
  - "Extension DDD"
  - "DDD / Index"
tags:
  - "extension-docs"
  - "extension-docs/ddd"
  - "ddd"
type: "domain-index"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Extension DDD

Domain model notes for the `markdownlint-obsidian` VS Code extension.

The extension domain is not a separate business domain from the core linter.
It is an editor-integration domain around existing `markdownlint-obsidian`
capabilities. DDD is useful here because several terms have different owners:
Flavor Grenade owns OFMarkdown document classification, core owns linting
semantics, and the extension owns VS Code feedback.

> [!NOTE] Domain spine
> Use [[ddd/ubiquitous-language]] for names and [[ddd/bounded-contexts]] for ownership boundaries.

## Index

| File | Contents |
| :--- | :--- |
| [[ddd/ubiquitous-language]] | Canonical extension terms |
| [[ddd/bounded-contexts]] | Extension bounded contexts and context map |
| [[ddd/editor-client/domain-model]] | VS Code client and dependency context |
| [[ddd/lint-feedback/domain-model]] | Diagnostics and live lint feedback context |
| [[ddd/configuration/domain-model]] | Config, trust, and file-system policy context |
| [[ddd/fix-workflow/domain-model]] | Quick fix, fix-all, and preview context |
| [[ddd/workspace-commands/domain-model]] | Command Palette and workspace lint context |

## Design Posture

- Keep extension entities small. Most extension state is session state, not
  durable business state.
- Treat `ofmarkdown` as a published language from Flavor Grenade, not as a
  classification this extension computes.
- Treat `LintResult`, `LintError`, and `Fix` as core-domain values imported
  through public APIs.
- Model VS Code APIs as adapters around extension domain decisions.
- Use domain events as facts meaningful to extension behavior, not generic
  CRUD notifications.

## See Also

- [Root DDD](../../../docs/ddd/bounded-contexts.md)
- [[architecture/flavor-grenade-dependency]]
- [[requirements/functional/index]]
