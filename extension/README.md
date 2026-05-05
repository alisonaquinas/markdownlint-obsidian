# markdownlint Obsidian

VS Code diagnostics and fixes for Obsidian Flavored Markdown.

This extension uses the bundled `markdownlint-obsidian` library for lint and
fix behavior. It does not require the CLI to be installed globally or in the
workspace.

Automatic live diagnostics run for documents classified as `ofmarkdown` by the
Flavor Grenade extension.

## Requirements

- VS Code `1.118.0` or newer.
- Flavor Grenade extension: `alisonaquinas.flavor-grenade-lsp`.
- File-backed workspace folders for live linting and workspace commands.

## Features

- Live diagnostics for `ofmarkdown` documents.
- Quick fixes and source fix-all for core-provided safe fixes.
- Fix preview for the active document.
- Workspace lint command.
- Open configuration command for `.obsidian-linter.jsonc` and related config
  names.
- Session-only live diagnostics disable and enable commands.
- Rule documentation links for built-in OFM and standard Markdown rules.

## Settings

| Setting | Default | Purpose |
| :--- | :--- | :--- |
| `markdownlintObsidian.enabled` | `true` | enables live diagnostics |
| `markdownlintObsidian.runMode` | `onType` | chooses `onType` or `onSave` linting |
| `markdownlintObsidian.debounceMs` | `250` | debounce for on-type linting |
| `markdownlintObsidian.configPath` | `null` | optional config file or directory |
| `markdownlintObsidian.workspaceGlobs` | `["**/*.md"]` | workspace lint globs |

## Trust And Workspace Support

Built-in linting can run in restricted mode. Custom rules are blocked unless
the workspace is trusted, because custom rule modules execute workspace code.

Virtual and untitled documents are not linted automatically. The extension
reports unsupported document modes instead of probing or writing unexpectedly.

## Privacy

The extension does not add telemetry. Linting runs locally in the VS Code
extension host against the bundled `markdownlint-obsidian` library.
