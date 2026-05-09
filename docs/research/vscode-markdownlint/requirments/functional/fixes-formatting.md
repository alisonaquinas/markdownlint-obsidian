---
title: "vscode-markdownlint Functional Requirements - Fixes And Formatting"
aliases:
  - "vscode-markdownlint Functional Requirements - Fixes And Formatting"
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
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/extension.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/README.md
---

# Fixes And Formatting

## Markdownlint.CodeActions

```text
Tag: Markdownlint.CodeActions
Gist: Provide Markdown quick fixes, fix-all actions, rule information actions, and configuration information actions.
Ambition: Authors can act on diagnostics from the light bulb or source fix-all workflow.
Scale: Percentage of markdownlint diagnostics for which the source-defined code actions are offered when requested code-action kind permits them.
Meter: VS Code integration test invoking `provideCodeActions` with diagnostics that have and lack `fixInfo`, have and lack rule information URLs, include `only` filters for QuickFix and SourceFixAll, and include non-markdownlint diagnostics.
Fail: Any eligible markdownlint diagnostic lacks its expected fix, info, fix-rule, fix-all, or configuration action; any non-markdownlint diagnostic receives markdownlint actions.
Goal: 100% of eligible diagnostics receive the expected source-defined actions and 0% of ineligible diagnostics receive them.
Stakeholders: Markdown authors.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `provideCodeActions`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.FixLine

```text
Tag: Markdownlint.FixLine
Gist: Apply a single markdownlint fix to the active editor line.
Ambition: Users can fix one supported violation without changing unrelated text.
Scale: Percentage of `markdownlint.fixLine` command invocations that apply the provided `fixInfo` to the intended active document line.
Meter: VS Code integration test with fix results that replace text, delete the first line, delete a middle or later line, and run with missing active editor or missing `fixInfo`.
Fail: A supported line fix edits the wrong line, changes unrelated text, leaves an inappropriate selection, or throws for no-op inputs.
Goal: 100% of supported line fixes apply the same edit as `markdownlint` `applyFix`; 100% of no-op inputs resolve without edit.
Stakeholders: Markdown authors.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `fixLine`; `markdownlint-cli2/markdownlint` `applyFix`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.FixAll

```text
Tag: Markdownlint.FixAll
Gist: Apply all supported markdownlint fixes in the active Markdown document, optionally filtered by rule.
Ambition: Users can fix all auto-fixable violations in one command or fix all instances of one rule.
Scale: Percentage of `markdownlint.fixAll` command invocations on active Markdown documents that replace the document text with the `applyFixes` output for the selected result set.
Meter: VS Code integration test with active Markdown document, non-Markdown document, no active editor, unfiltered invocation, rule-filtered invocation, and no-change result.
Fail: Fix-all changes non-Markdown documents, applies fixes for the wrong rule filter, changes text when `applyFixes` returns identical text, or throws for no-op inputs.
Goal: 100% of in-scope fix-all invocations match `applyFixes`; 100% of out-of-scope invocations resolve without edit.
Stakeholders: Markdown authors.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `fixAll`; README `Fix`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.RangeFormatting

```text
Tag: Markdownlint.RangeFormatting
Gist: Register Markdown range formatting that applies markdownlint fixes within the requested range.
Ambition: VS Code range-formatting requests use markdownlint auto-fixes; the README also documents Markdown formatting through the Format Document and Format Selection commands.
Scale: Percentage of formatting requests on Markdown documents that return a full-document replacement edit only when fixable violations exist inside the requested range.
Meter: VS Code integration test calling the registered range formatting provider with Markdown and non-Markdown documents, ranges with fixable violations, ranges without fixable violations, and documents whose fixes change text. Add a smoke test for the README-claimed Format Document and Format Selection commands if treating those commands as guaranteed behavior.
Fail: Formatting edits non-Markdown documents, applies fixes outside the requested diagnostic range set, omits an expected replacement edit, or returns an edit when fixed text equals original text.
Goal: 100% of formatting requests match source behavior.
Stakeholders: Markdown authors, VS Code users.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `formatDocument` and `registerDocumentRangeFormattingEditProvider`; README `Fix`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]
