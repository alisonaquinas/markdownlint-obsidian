---
title: "vscode-markdownlint Functional Requirements - Editing And Linting"
aliases:
  - "vscode-markdownlint Functional Requirements - Editing And Linting"
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

# Editing And Linting

## Markdownlint.Activation

```text
Tag: Markdownlint.Activation
Gist: Activate the extension when a Markdown document is used.
Ambition: Markdown linting becomes available automatically for VS Code Markdown editing sessions.
Scale: Percentage of VS Code sessions where the extension activates after the `markdown` language is opened.
Meter: Inspect the manifest activation events and run a VS Code extension-host smoke test that opens a `markdown` document and observes registered markdownlint providers, commands, and diagnostics collection.
Fail: Less than 100% of manifest-supported `markdown` activation scenarios activate the extension.
Goal: 100% of manifest-supported `markdown` activation scenarios activate the extension.
Stakeholders: Markdown authors, VS Code users, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `package.json` activation event `onLanguage:markdown`; `extension.mjs` `activate`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.DocumentEligibility

```text
Tag: Markdownlint.DocumentEligibility
Gist: Lint only Markdown documents with supported URI schemes.
Ambition: The extension avoids unsupported or problematic document schemes while supporting ordinary, untitled, remote, web-test, and gist-backed Markdown documents.
Scale: Percentage of lint requests whose document eligibility decision matches the source predicate: language id is `markdown`, scheme is one of `untitled`, `file`, `vscode-vfs`, `vscode-test-web`, or `gist`, and `vscode-vfs` authority matches an open workspace.
Meter: Unit or integration test `isMarkdownDocument` behavior using documents covering supported schemes, unsupported schemes, non-Markdown language ids, and `vscode-vfs` authority mismatch.
Fail: Any unsupported document is linted, or any supported in-scope Markdown document is rejected.
Goal: 100% predicate match for the listed document categories.
Stakeholders: Markdown authors, remote workspace users, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `isMarkdownDocument`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.LintTrigger

```text
Tag: Markdownlint.LintTrigger
Gist: Run linting on the configured editor lifecycle events.
Ambition: Diagnostics stay current while respecting the user's configured run mode.
Scale: Percentage of in-scope editor events that produce the source-defined lint behavior.
Meter: VS Code integration test covering document open, text change with `markdownlint.run: onType`, save with `markdownlint.run: onSave`, close, visible editor change, active editor change under focus mode, selection change under focus mode, configuration change, and workspace trust grant.
Fail: Any in-scope lifecycle event fails to request, suppress, clear, or delete lint diagnostics as defined by source behavior.
Goal: 100% of in-scope lifecycle events match source behavior.
Stakeholders: Markdown authors, VS Code users.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `didOpenTextDocument`, `didChangeTextDocument`, `didSaveTextDocument`, `didCloseTextDocument`, `didChangeVisibleTextEditors`, `didChangeActiveTextEditor`, `didChangeTextEditorSelection`, `didChangeConfiguration`, `didGrantWorkspaceTrust`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.ConfigurationResolution

```text
Tag: Markdownlint.ConfigurationResolution
Gist: Resolve markdownlint configuration from files, VS Code settings, defaults, and explicit config paths.
Ambition: Runtime linting follows the same configuration sources documented for users.
Scale: Percentage of lint invocations whose markdownlint options include the source-defined default config, user/workspace config, custom rules, explicit config-file argument, and supported `extends` resolution.
Meter: Integration test invoking linting with combinations of `.markdownlint*`, `.markdownlint-cli2*`, `markdownlint.config`, `markdownlint.configFile`, `markdownlint.customRules`, global/workspace `extends`, and path expansion. For `markdownlint.config.extends`, cover `${userHome}`, `${workspaceFolder}`, and tilde expansion; for `markdownlint.configFile`, cover the explicit `--config` argument and tilde expansion only.
Fail: Any supported configuration source is ignored, applied in the wrong place, expanded with unsupported substitutions, or resolved from the wrong base directory.
Goal: 100% of supported configuration combinations match source and README behavior.
Stakeholders: Markdown authors, workspace maintainers, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `getConfig`, `getConfigFileArguments`, `getCustomRules`, `getOptionsDefault`; README configuration section.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.Diagnostics

```text
Tag: Markdownlint.Diagnostics
Gist: Convert markdownlint results into VS Code diagnostics.
Ambition: Authors see rule violations in the editor and Problems panel with correct severity, range, source, rule identity, and rule information target.
Scale: Percentage of markdownlint result objects converted into expected VS Code diagnostics when linting is enabled and severity is not ignored.
Meter: Integration test with markdownlint results that include rule names, aliases, descriptions, error details, rule information URLs, warning/error severities, line-only locations, and explicit error ranges.
Fail: Any reportable result lacks a diagnostic, has the wrong range/severity/message/source/code, or persists after stale diagnostic generation.
Goal: 100% of reportable results are converted correctly; 100% of ignored or focus-suppressed results are omitted.
Stakeholders: Markdown authors, VS Code users.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `lint`, `getDiagnosticSeverity`, `markdownlintWrapper`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.FocusMode

```text
Tag: Markdownlint.FocusMode
Gist: Suppress diagnostics near the active cursor when focus mode is enabled.
Ambition: Users can reduce transient lint noise while typing near known violations.
Scale: Percentage of diagnostics hidden when their line falls within the configured cursor exclusion band for the active document.
Meter: Integration test with `markdownlint.focusMode` set to `false`, `true`, `0`, positive integers, negative integers, and non-integer values while moving the cursor across diagnostic lines.
Fail: A diagnostic inside an enabled focus-mode exclusion band is shown, or a diagnostic outside the band is hidden.
Goal: 100% of diagnostics are shown or hidden according to the source focus-mode predicate.
Stakeholders: Markdown authors.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `lint`, `didChangeActiveTextEditor`, `didChangeTextEditorSelection`; README `markdownlint.focusMode`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]
