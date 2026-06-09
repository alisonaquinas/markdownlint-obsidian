---
title: "vscode-markdownlint Functional Requirements"
aliases:
  - "vscode-markdownlint Functional Requirements"
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
  - https://github.com/DavidAnson/vscode-markdownlint/tree/main/test
---

# vscode-markdownlint Functional Requirements

## Scope

These Planguage-style functional requirements describe how
`DavidAnson.vscode-markdownlint` works today, based on upstream `main` inspected
on 2026-05-04.

The requirements are descriptive, not proposed changes. They use functional
coverage scales such as "percentage of in-scope events" because the source code
supports exact expected behavior. Performance, usability, security, and other
quality targets are intentionally out of scope unless they are necessary to
state a functional behavior.

## Inventory

| File | Tags |
|---|---|
| `editing-linting.md` | `Markdownlint.Activation`, `Markdownlint.DocumentEligibility`, `Markdownlint.LintTrigger`, `Markdownlint.ConfigurationResolution`, `Markdownlint.Diagnostics`, `Markdownlint.FocusMode` |
| `fixes-formatting.md` | `Markdownlint.CodeActions`, `Markdownlint.FixLine`, `Markdownlint.FixAll`, `Markdownlint.RangeFormatting` |
| `workspace-commands.md` | `Markdownlint.WorkspaceLint`, `Markdownlint.OpenConfigFile`, `Markdownlint.ToggleLinting`, `Markdownlint.ConfigurationWatchers` |
| `contributions-and-trust.md` | `Markdownlint.ManifestContributions`, `Markdownlint.SchemaValidation`, `Markdownlint.Snippets`, `Markdownlint.WorkspaceTrust`, `Markdownlint.FileSystemAdapter` |
| `test-derived.md` | `Markdownlint.ErrorSerialization`, `Markdownlint.MetadataConsistency` |

## Source Interpretation Notes

- The extension is activated by `onLanguage:markdown`.
- The extension uses the VS Code API directly; it is not an LSP client.
- Runtime linting uses `markdownlint-cli2` in-process.
- Unit tests currently cover metadata consistency and error serialization only;
  most user-facing behavior is inferred from `extension.mjs`, `package.json`,
  and `README.md`.
- `test-ui/` exists but is not included as unit-test evidence in this set.
