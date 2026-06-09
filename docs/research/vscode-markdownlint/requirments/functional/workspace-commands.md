---
title: "vscode-markdownlint Functional Requirements - Workspace Commands"
aliases:
  - "vscode-markdownlint Functional Requirements - Workspace Commands"
tags:
  - "research/vscode"
  - "research/markdownlint"
  - "requirements/functional"
  - "planguage"
  - "docs"
  - "docs/research"
  - "docs/research/vscode-markdownlint"
type: "research"
status: "current"
updated: 2026-05-04
up: "[[research/vscode-markdownlint/technical-stack]]"
sources:
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/package.json
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/extension.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/README.md
---

# Workspace Commands

## Markdownlint.WorkspaceLint

```text
Tag: Markdownlint.WorkspaceLint
Gist: Lint all configured Markdown workspace files through a VS Code task.
Ambition: Users can run whole-workspace Markdown linting and see output in the terminal and Problems panel.
Scale: Percentage of workspace folders processed by the `markdownlint.lintWorkspace` command using configured workspace globs and the markdownlint problem matcher.
Meter: VS Code integration test with single-root and multi-root workspaces, custom `markdownlint.lintWorkspaceGlobs`, excluded directories, markdownlint output, and task fetch/execute behavior.
Fail: A workspace folder is skipped, configured globs are ignored, the task cannot be fetched, results do not use the contributed problem matcher, or terminal output does not close after completion.
Goal: 100% of workspace folders are linted sequentially with configured globs and problem matcher output.
Stakeholders: Markdown authors, repository maintainers.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `LintWorkspacePseudoterminal`, `lintWorkspace`, `lintWorkspaceViaTask`, task provider registration; `package.json` task definition and problem matcher; README `Workspace`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.OpenConfigFile

```text
Tag: Markdownlint.OpenConfigFile
Gist: Open an existing workspace markdownlint config file or create a default pending `.markdownlint.json`.
Ambition: Users can reach configuration without remembering supported file names.
Scale: Percentage of workspace folders where `markdownlint.openConfigFile` opens the first existing supported config file or creates an untitled `.markdownlint.json` initialized with the default config.
Meter: VS Code integration test with each supported config filename present, multiple config files present, no config files, multi-root workspaces, and missing workspace.
Fail: Existing config files are ignored, file search order differs from source order, a default file is created with content other than the default config, or a workspace folder is skipped.
Goal: 100% of workspace folders follow the source-defined open-or-create behavior.
Stakeholders: Markdown authors, workspace maintainers.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `openConfigFile`; README `Configure`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.ToggleLinting

```text
Tag: Markdownlint.ToggleLinting
Gist: Temporarily toggle markdownlint diagnostics for the current extension session.
Ambition: Users can pause and resume linting without changing persistent settings.
Scale: Percentage of `markdownlint.toggleLinting` invocations that invert the in-memory linting state, clear diagnostics, and re-lint visible Markdown files according to the new state.
Meter: VS Code integration test invoking the command twice in a workspace with visible Markdown files and existing diagnostics.
Fail: Toggle state is persisted across workspace sessions, diagnostics remain after disabling, visible files are not re-evaluated after enabling, or non-Markdown documents are linted.
Goal: 100% of toggle invocations match source behavior.
Stakeholders: Markdown authors.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `toggleLinting`, `clearDiagnosticsAndLintVisibleFiles`, `lint`; README `Disable`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.ConfigurationWatchers

```text
Tag: Markdownlint.ConfigurationWatchers
Gist: Re-lint visible files when markdownlint configuration or options files change.
Ambition: Saved configuration changes take effect without restarting VS Code.
Scale: Percentage of create, change, and delete events for `.markdownlint.{jsonc,json,yaml,yml,cjs}` and `.markdownlint-cli2.{jsonc,yaml,cjs}` files under each workspace folder that clear diagnostics and request visible-file linting.
Meter: VS Code integration test creating, editing, and deleting each supported config/options filename in added and removed workspace folders.
Fail: A supported file change does not clear diagnostics and re-lint, a removed workspace folder keeps active watchers, or an added workspace folder lacks watchers.
Goal: 100% of supported watcher events match source behavior.
Stakeholders: Markdown authors, workspace maintainers.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `createFileSystemWatchers`, `disposeFileSystemWatchers`, `didChangeWorkspaceFolders`, `clearDiagnosticsAndLintVisibleFiles`; README `Configure`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]
