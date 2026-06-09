---
title: "Workspace Commands"
aliases:
  - "Workspace Commands"
  - "Requirements / Functional / Workspace Commands"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/functional"
  - "requirements"
type: "functional-requirement"
status: "current"
updated: 2026-05-09
up: "[[requirements/functional/index]]"
---

# Workspace Commands

## MarkdownlintObsidian.WorkspaceLint

```text
Tag: MarkdownlintObsidian.WorkspaceLint
Gist: Lint configured workspace Markdown files from VS Code.
Ambition: Maintainers can run repository-wide OFM linting without leaving the editor.
Scale: Percentage of workspace folders processed by the workspace-lint command using effective markdownlint-obsidian config, globs, ignores, vault root, and output policy.
Meter: VS Code integration test with single-root and multi-root workspaces, configured globs, ignored paths, explicit vault roots, missing vault roots, no matching files, successful lint results, and failing lint results.
Fail: A workspace folder is skipped, configured globs or ignores are ignored, vault context differs from core behavior, output is unavailable, or command failure is silent.
Goal: 100% of workspace folders follow effective config and report results or actionable errors.
Stakeholders: Repository maintainers, Markdown authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [[requirements/user/workspace-and-trust]]; [engine lint API](../../../../packages/core/src/engine/index.ts).
```

User trace: [[requirements/user/workspace-and-trust]]

## MarkdownlintObsidian.OpenConfigFile

```text
Tag: MarkdownlintObsidian.OpenConfigFile
Gist: Open an existing markdownlint-obsidian config file or create a starter draft.
Ambition: Users can reach configuration without memorizing supported filenames.
Scale: Percentage of workspace folders where the open-config command opens the nearest supported existing config file or creates an untitled starter `.obsidian-linter.jsonc`.
Meter: VS Code integration test with each supported config filename, multiple config files with defined precedence, nested folders, no config file, multi-root workspaces, and no workspace folder.
Fail: Existing supported config files are ignored, search order differs from documented behavior, starter content is not a valid config draft, or a workspace folder is skipped without explanation.
Goal: 100% of covered workspace cases follow documented open-or-create behavior.
Stakeholders: Markdown authors, repository maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [[requirements/user/configuration]]; [ConfigLoader](../../../../packages/core/src/infrastructure/config/ConfigLoader.ts).
```

User trace: [[requirements/user/configuration]]

## MarkdownlintObsidian.ToggleLinting

```text
Tag: MarkdownlintObsidian.ToggleLinting
Gist: Temporarily toggle live diagnostics for the current VS Code session.
Ambition: Users can pause and resume extension diagnostics without editing persistent config.
Scale: Percentage of toggle invocations that invert in-memory linting state, clear diagnostics when disabled, and re-lint visible eligible documents when enabled.
Meter: VS Code integration test invoking the command repeatedly in a workspace with visible `ofmarkdown` documents, generic Markdown documents, existing diagnostics, and no visible eligible documents.
Fail: Toggle state persists across sessions, diagnostics remain after disabling, visible eligible files are not re-evaluated after enabling, or ineligible documents are linted.
Goal: 100% of toggle invocations match documented temporary behavior.
Stakeholders: Markdown authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [[requirements/user/workspace-and-trust]].
```

User trace: [[requirements/user/workspace-and-trust]]

## MarkdownlintObsidian.ConfigurationWatchers

```text
Tag: MarkdownlintObsidian.ConfigurationWatchers
Gist: Re-lint visible eligible files when supported configuration files change.
Ambition: Saved configuration changes affect editor diagnostics without restarting VS Code.
Scale: Percentage of create, change, and delete events for supported config filenames under workspace folders that clear affected diagnostics and request visible-file linting.
Meter: VS Code integration test creating, editing, deleting, adding workspace folders, and removing workspace folders for `.obsidian-linter.jsonc`, `.obsidian-linter.yaml`, `.markdownlint-cli2.jsonc`, `.markdownlint-cli2.yaml`, `.markdownlint.jsonc`, and `.markdownlint.yaml`.
Fail: A supported config change does not refresh visible eligible diagnostics, a removed workspace folder keeps active watchers, or an added workspace folder lacks watchers.
Goal: 100% of supported watcher events match documented refresh behavior.
Stakeholders: Markdown authors, repository maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [ConfigLoader](../../../../packages/core/src/infrastructure/config/ConfigLoader.ts); [[requirements/user/configuration]].
```

User trace: [[requirements/user/configuration]], [[requirements/user/editing-feedback]]
