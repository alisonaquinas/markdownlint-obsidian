# VS Code Extension Architecture Overview

## Purpose

The VS Code extension should make `markdownlint-obsidian` useful while editing,
not only in CI. It should surface the same rule behavior users get from the CLI
and core package, with VS Code-native diagnostics, quick fixes, commands,
settings, and output.

The extension assumes `flavor-grenade-lsp` is installed as a VS Code extension
dependency. Flavor Grenade owns OFMarkdown language-mode detection and promotes
eligible vault documents to the `ofmarkdown` language id. This extension uses
that language id as the live-lint trigger.

## Boundary

Editor code owns editor integration:

- activation events;
- document selection;
- diagnostic publishing;
- command palette commands;
- settings and workspace trust declarations;
- output channel and status UI;
- packaging and VSIX release concerns.

Core code owns linting behavior:

- OFM parsing;
- rule execution;
- config validation;
- vault and block-reference resolution;
- fixes;
- formatter-neutral lint results.

The extension must not fork or reimplement rules.

Flavor Grenade owns OFMarkdown document classification:

- vault membership detection;
- `markdown` to `ofmarkdown` promotion;
- OFMarkdown grammar and language configuration.

This extension must not duplicate that classification logic.

## Candidate Runtime Shapes

| Shape | Summary | Fit |
| :--- | :--- | :--- |
| In-process client | Extension imports `packages/core` and lints `ofmarkdown` documents inside the extension host | Best first implementation if live linting can stay simple |
| Local LSP server | Extension starts a Node or compiled server and talks through `vscode-languageclient` | Better if persistent workspace state, cross-document indexing, or future editor features grow |
| CLI subprocess | Extension shells out to built CLI for each lint operation | Useful fallback for workspace commands, weak fit for fast live diagnostics |

## Initial Preference

Start with the in-process shape unless requirements force an LSP boundary. It
keeps packaging smaller and reuses the existing TypeScript package directly.
Keep the architecture compatible with a later LSP split by isolating editor
adapters from lint orchestration.

## Expected Components

| Component | Responsibility |
| :--- | :--- |
| Extension activation | Register diagnostics, commands, config listeners, and `ofmarkdown` document listeners |
| Flavor Grenade dependency check | Verify `alisonaquinas.flavor-grenade-lsp` is installed and explain missing dependency behavior |
| Lint coordinator | Convert VS Code documents and settings into core lint requests |
| Diagnostic mapper | Convert `LintError` values into VS Code diagnostics |
| Fix provider | Convert core fixes into VS Code code actions and fix-all actions |
| Config resolver | Merge VS Code settings with repo config files |
| Workspace lint command | Run lint across selected workspace files and stream output |
| Output channel | Show lint run logs, config errors, and extension failures |

## Data Flow

```text
VS Code ofmarkdown document event
  -> extension lint coordinator
  -> markdownlint-obsidian core engine
  -> LintResult[]
  -> diagnostic mapper
  -> VS Code DiagnosticCollection
```

Fixes flow in the other direction:

```text
VS Code code action request
  -> diagnostics for selection or file
  -> core fix payloads
  -> VS Code WorkspaceEdit
  -> editor applies edit
```

## Non-Goals

- No separate rule implementation in the extension.
- No duplicate implementation of Flavor Grenade's `ofmarkdown` promotion.
- No automatic live linting for generic `markdown` documents by default.
- No Marketplace publishing flow until extension behavior and packaging are
  specified.
- No browser or virtual workspace support until file-system needs are designed.
- No automatic migration of user config files without explicit requirements.

## See Also

- [Flavor Grenade Dependency Contract](flavor-grenade-dependency.md)
