---
title: "Extension Functional Requirements"
aliases:
  - "Extension Functional Requirements"
  - "Requirements / Functional / Index"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/functional"
  - "requirements"
type: "functional-requirements-index"
status: "current"
updated: 2026-05-09
up: "[[requirements/index]]"
---

# Extension Functional Requirements

## Scope

These Planguage-style functional requirements define the VS Code extension
behavior for `markdownlint-obsidian`.

They adapt the coverage model from
[vscode-markdownlint functional research](../../../../docs/research/vscode-markdownlint/requirments/functional/index.md)
to this extension's architecture:

- Flavor Grenade LSP is an installed VS Code extension dependency.
- `ofmarkdown` is the primary live-lint eligibility signal.
- `markdownlint-obsidian` core remains the rule and fix engine.
- Extension code owns diagnostics, code actions, commands, configuration UI,
  trust policy, and package contributions.

## Inventory

| File | Tags |
| :--- | :--- |
| [[requirements/functional/editing-linting]] | `MarkdownlintObsidian.ExtensionDependency`, `MarkdownlintObsidian.Activation`, `MarkdownlintObsidian.DocumentEligibility`, `MarkdownlintObsidian.LintTrigger`, `MarkdownlintObsidian.ConfigurationResolution`, `MarkdownlintObsidian.Diagnostics` |
| [[requirements/functional/fixes-formatting]] | `MarkdownlintObsidian.CodeActions`, `MarkdownlintObsidian.QuickFix`, `MarkdownlintObsidian.FixAll`, `MarkdownlintObsidian.FixCheckPreview`, `MarkdownlintObsidian.FormattingBoundary`, `MarkdownlintObsidian.RuleHelp` |
| [[requirements/functional/workspace-commands]] | `MarkdownlintObsidian.WorkspaceLint`, `MarkdownlintObsidian.OpenConfigFile`, `MarkdownlintObsidian.ToggleLinting`, `MarkdownlintObsidian.ConfigurationWatchers` |
| [[requirements/functional/contributions-and-trust]] | `MarkdownlintObsidian.ManifestContributions`, `MarkdownlintObsidian.SchemaValidation`, `MarkdownlintObsidian.WorkspaceTrust`, `MarkdownlintObsidian.CustomRuleTrust`, `MarkdownlintObsidian.FileSystemStrategy` |
| [[requirements/functional/test-derived]] | `MarkdownlintObsidian.ErrorReporting`, `MarkdownlintObsidian.MetadataConsistency` |

## Source Interpretation Notes

- These remain implementation requirements; current local evidence is tracked
  in [[plans/execution-ledger]].
- Targets use functional coverage scales because behavior can be tested against
  manifest entries, VS Code extension-host events, and core API outputs.
- Numeric goals are limited to binary or coverage behaviors that can be tested.
- Quality targets such as latency are intentionally omitted until benchmarks or
  stakeholder commitments exist.
