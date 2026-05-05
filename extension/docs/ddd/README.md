# Extension DDD

Domain model notes for the planned `markdownlint-obsidian` VS Code extension.

The extension domain is not a separate business domain from the core linter.
It is an editor-integration domain around existing `markdownlint-obsidian`
capabilities. DDD is useful here because several terms have different owners:
Flavor Grenade owns OFMarkdown document classification, core owns linting
semantics, and the extension owns VS Code feedback.

## Index

| File | Contents |
| :--- | :--- |
| [ubiquitous-language.md](ubiquitous-language.md) | Canonical extension terms |
| [bounded-contexts.md](bounded-contexts.md) | Extension bounded contexts and context map |
| [editor-client/domain-model.md](editor-client/domain-model.md) | VS Code client and dependency context |
| [lint-feedback/domain-model.md](lint-feedback/domain-model.md) | Diagnostics and live lint feedback context |
| [configuration/domain-model.md](configuration/domain-model.md) | Config, trust, and file-system policy context |
| [fix-workflow/domain-model.md](fix-workflow/domain-model.md) | Quick fix, fix-all, and preview context |
| [workspace-commands/domain-model.md](workspace-commands/domain-model.md) | Command Palette and workspace lint context |

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
- [Flavor Grenade Dependency Contract](../architecture/flavor-grenade-dependency.md)
- [Functional Requirements](../requirements/functional/index.md)
