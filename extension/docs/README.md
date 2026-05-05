# VS Code Extension Documentation

Planning and reference wiki for the future `markdownlint-obsidian` VS Code
extension.

This tree is intentionally separate from root `docs/`. Root docs describe the
core linter, CLI, GitHub Action, rules, and project architecture. Extension docs
describe editor integration: activation, diagnostics, settings, commands,
language modes, packaging, tests, and release behavior.

## Index

| Directory / File | Contents |
| :--- | :--- |
| [architecture/](architecture/overview.md) | Extension architecture, boundaries, and data flow |
| [bdd/](bdd/README.md) | Behavior-domain scenarios and traceability |
| [ddd/](ddd/README.md) | Extension bounded contexts and ubiquitous language |
| [requirements/](requirements/index.md) | User and functional requirements for the extension |
| [tests/](tests/README.md) | Unit, verification, validation, and automation test plans |
| [roadmap.md](roadmap.md) | Extension implementation roadmap and phase gates |
| [plans/](plans/index.md) | Extension delivery plans and execution notes |
| [research/](research/index.md) | Supporting research for extension decisions |
| [adr/](adr/index.md) | Extension-specific Architecture Decision Records |

## Initial Scope

The extension should provide VS Code feedback for the existing
`markdownlint-obsidian` library without duplicating lint rules in editor code.
The extension should bundle that library as its lint engine dependency. Users
should not need to install the CLI globally or in their workspace for editor
diagnostics, fixes, previews, or workspace commands. The extension should also
depend on the Flavor Grenade LSP extension for OFMarkdown language detection,
then lint documents that Flavor Grenade has promoted to the `ofmarkdown`
language id.

The desired direction is a `markdownlint-cli2`-style editing experience using a
technology stack and document-selection model closer to `flavor-grenade-lsp`:

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

## Runtime Direction

Flavor Grenade owns OFMarkdown language-mode detection. The extension runtime
should call the bundled `markdownlint-obsidian` library through public APIs.
The current planning bias is:

- keep the first implementation in-process;
- preserve core ownership of lint behavior through a thin library adapter;
- do not shell out to `markdownlint-obsidian-cli` or require it to be installed;
- choose an LSP boundary if live diagnostics, workspace indexing, or future
  cross-document editor features need persistent server state.

See [Flavor Grenade Dependency Contract](architecture/flavor-grenade-dependency.md).

## Contributing

- Keep extension-specific docs here.
- Link to root docs instead of copying rule reference text.
- Keep research source-backed and dated.
- Run `bun run test:dogfood:extension-docs` before commit. The aggregate
  `bun run test:dogfood` runs both root docs and extension docs.
