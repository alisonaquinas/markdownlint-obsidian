---
title: "vscode-markdownlint User Requirements"
aliases:
  - "vscode-markdownlint User Requirements"
tags:
  - "research/vscode"
  - "research/markdownlint"
  - "requirements/user"
  - "docs"
  - "docs/research"
  - "docs/research/vscode-markdownlint"
type: "research"
status: "current"
updated: 2026-05-04
up: "[[research/vscode-markdownlint/technical-stack]]"
sources:
  - ../functional/index.md
  - ../../tests/index.md
---

# vscode-markdownlint User Requirements

## Scope

These user requirements are inferred from the functional requirements and test
catalog for `DavidAnson.vscode-markdownlint`, checked on 2026-05-04.

They describe user-visible needs and expectations, not implementation details.
They are descriptive research notes for a Flavor Grenade companion VS Code
extension, not proposed changes to upstream.

## Inventory

| File | Requirements |
|---|---|
| `editing-feedback.md` | `UserMarkdownlint.AutomaticActivation`, `UserMarkdownlint.RelevantDocuments`, `UserMarkdownlint.CurrentDiagnostics`, `UserMarkdownlint.FocusWhileTyping`, `UserMarkdownlint.RunModeControl` |
| `fixes-formatting.md` | `UserMarkdownlint.QuickFix`, `UserMarkdownlint.FixAll`, `UserMarkdownlint.FormatWithFixes`, `UserMarkdownlint.RuleHelp` |
| `configuration.md` | `UserMarkdownlint.ConfigSources`, `UserMarkdownlint.ConfigDiscovery`, `UserMarkdownlint.SchemaAssistance`, `UserMarkdownlint.CustomRules`, `UserMarkdownlint.Snippets` |
| `workspace-and-trust.md` | `UserMarkdownlint.WorkspaceLint`, `UserMarkdownlint.TemporaryDisable`, `UserMarkdownlint.RemoteAndVirtualWorkspaces`, `UserMarkdownlint.TrustedJavaScript`, `UserMarkdownlint.ActionableErrors`, `UserMarkdownlint.MetadataConfidence` |

## Interpretation Notes

- "User" includes Markdown authors, repository maintainers, and extension
  maintainers when they consume published metadata or diagnostics.
- Functional tags remain the traceable source of exact behavior.
- Test-derived requirements are included only where they affect user confidence
  or troubleshooting.
