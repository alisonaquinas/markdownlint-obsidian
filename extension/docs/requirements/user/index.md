---
title: "Extension User Requirements"
aliases:
  - "Extension User Requirements"
  - "Requirements / User / Index"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/user"
  - "requirements"
type: "user-requirements-index"
status: "current"
updated: 2026-05-09
up: "[[requirements/index]]"
---

# Extension User Requirements

## Scope

These requirements adapt the
[vscode-markdownlint user research](../../../../docs/research/vscode-markdownlint/requirments/user/index.md)
to `markdownlint-obsidian` capabilities.

They describe user-visible needs for the VS Code extension. They are a baseline
for functional requirements, architecture decisions, and tests.

## Inventory

| File | Requirements |
| :--- | :--- |
| [[requirements/user/editing-feedback]] | `UserMarkdownlintObsidian.FlavorGrenadeDependency`, `UserMarkdownlintObsidian.AutomaticActivation`, `UserMarkdownlintObsidian.OFMRelevantDocuments`, `UserMarkdownlintObsidian.CurrentDiagnostics`, `UserMarkdownlintObsidian.RunModeControl`, `UserMarkdownlintObsidian.VaultAwareFeedback` |
| [[requirements/user/fixes-formatting]] | `UserMarkdownlintObsidian.QuickFix`, `UserMarkdownlintObsidian.FixAllDocument`, `UserMarkdownlintObsidian.FixCheckPreview`, `UserMarkdownlintObsidian.RuleHelp`, `UserMarkdownlintObsidian.NoUnsafeFormatting` |
| [[requirements/user/configuration]] | `UserMarkdownlintObsidian.ConfigSources`, `UserMarkdownlintObsidian.ConfigDiscovery`, `UserMarkdownlintObsidian.SchemaAssistance`, `UserMarkdownlintObsidian.CustomRules`, `UserMarkdownlintObsidian.RuleFamilyVisibility` |
| [[requirements/user/workspace-and-trust]] | `UserMarkdownlintObsidian.WorkspaceLint`, `UserMarkdownlintObsidian.TemporaryDisable`, `UserMarkdownlintObsidian.TrustedCustomRules`, `UserMarkdownlintObsidian.UnsupportedWorkspaceModes`, `UserMarkdownlintObsidian.ActionableErrors`, `UserMarkdownlintObsidian.MetadataConfidence` |

## Adaptation Notes

- The upstream `vscode-markdownlint` extension embeds `markdownlint-cli2`
  behavior. This extension must expose `markdownlint-obsidian` behavior instead.
- Flavor Grenade LSP owns OFMarkdown document classification. This extension
  uses `ofmarkdown` as the live-lint eligibility signal.
- Requirements mention current core and CLI capabilities only when those
  capabilities exist today.
- Extension-specific affordances, such as pause/resume linting and config
  schema contributions, are part of the extension baseline.
- Formatting is intentionally narrower than upstream markdownlint. The current
  core fix model supports safe line edits, not whole-document formatting.
