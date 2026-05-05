# Fixes And Formatting

## MarkdownlintObsidian.CodeActions

```text
Tag: MarkdownlintObsidian.CodeActions
Gist: Provide code actions for markdownlint-obsidian diagnostics.
Ambition: Authors can act on lint diagnostics from VS Code's light bulb and source action workflows.
Scale: Percentage of eligible markdownlint-obsidian diagnostics for which the expected quick fix, fix-all, rule help, or configuration action is offered when requested code-action kind permits it.
Meter: VS Code integration test invoking code actions with diagnostics that have and lack core fix payloads, have OFM and MD rule codes, include system diagnostics, include custom rule diagnostics, include non-markdownlint-obsidian diagnostics, and request QuickFix or SourceFixAll kinds.
Fail: Any eligible diagnostic lacks its expected action, or any unrelated diagnostic receives markdownlint-obsidian actions.
Goal: 100% of eligible diagnostics receive expected actions and 0% of ineligible diagnostics receive them.
Stakeholders: Markdown authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [fixes user requirements](../user/fixes-formatting.md); [Fix](../../../../packages/core/src/domain/linting/Fix.ts).
```

User trace: [UserMarkdownlintObsidian.QuickFix](../user/fixes-formatting.md), [UserMarkdownlintObsidian.RuleHelp](../user/fixes-formatting.md)

## MarkdownlintObsidian.QuickFix

```text
Tag: MarkdownlintObsidian.QuickFix
Gist: Apply one core-provided fix from a diagnostic.
Ambition: Users can fix one supported violation without editing unrelated text.
Scale: Percentage of quick-fix invocations that translate the diagnostic's core `Fix` payload into the intended VS Code workspace edit.
Meter: VS Code integration test with fix payloads that insert, delete, and replace text on one line; diagnostics without fixes; stale documents; out-of-range fixes; and documents with changed versions between diagnostic and action.
Fail: A quick fix edits the wrong file or range, changes unrelated text, applies a stale unsafe edit, or throws for no-op inputs.
Goal: 100% of valid fix payloads apply equivalent edits and 100% of invalid or missing fix payloads resolve without unsafe edit.
Stakeholders: Markdown authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [autofix guide](../../../../docs/guides/autofix.md); [Fix](../../../../packages/core/src/domain/linting/Fix.ts).
```

User trace: [UserMarkdownlintObsidian.QuickFix](../user/fixes-formatting.md)

## MarkdownlintObsidian.FixAll

```text
Tag: MarkdownlintObsidian.FixAll
Gist: Apply all safe core fixes in the active eligible document.
Ambition: Users can clean up routine fixable issues with one action while preserving core conflict handling.
Scale: Percentage of fix-all invocations on eligible documents whose resulting text matches the core fix pipeline for the selected document and rule filter.
Meter: VS Code integration test with active `ofmarkdown` document, generic `markdown` document, no active editor, fixable OFM rules, fixable MD rules, non-fixable diagnostics, conflicting fixes, rule-filtered fix-all, and no-change result.
Fail: Fix-all changes ineligible documents, applies fixes outside the selected scope, ignores core conflicts, changes text when core output is identical, or throws for no-op inputs.
Goal: 100% of in-scope fix-all invocations match core fix behavior and 100% of out-of-scope invocations resolve without edit.
Stakeholders: Markdown authors, repository maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [FixUseCase](../../../../packages/core/src/application/FixUseCase.ts); [autofix guide](../../../../docs/guides/autofix.md).
```

User trace: [UserMarkdownlintObsidian.FixAllDocument](../user/fixes-formatting.md)

## MarkdownlintObsidian.FixCheckPreview

```text
Tag: MarkdownlintObsidian.FixCheckPreview
Gist: Report available fixes without writing files.
Ambition: Editor workflows can mirror `--fix-check` gates before users choose to apply changes.
Scale: Percentage of preview requests that report the same file and fix availability as the core check-mode fix pipeline.
Meter: Integration test comparing extension preview output to `fix({ check: true })` for files with no fixes, one fix, multiple fixes, conflicts, and remaining non-fixable diagnostics.
Fail: Preview writes workspace files, omits a file with available fixes, reports fixes when none exist, or disagrees with core check-mode outcome.
Goal: 100% preview results match core check-mode results for covered cases and 0 files are modified.
Stakeholders: Repository maintainers, CI maintainers, Markdown authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [engine fix API](../../../../packages/core/src/engine/index.ts); [autofix guide](../../../../docs/guides/autofix.md).
```

User trace: [UserMarkdownlintObsidian.FixCheckPreview](../user/fixes-formatting.md)

## MarkdownlintObsidian.FormattingBoundary

```text
Tag: MarkdownlintObsidian.FormattingBoundary
Gist: Avoid presenting lint fixes as a general Markdown formatter.
Ambition: Users understand that extension edits are rule-provided safe fixes, not whole-document formatting.
Scale: Percentage of VS Code formatting registrations and commands whose behavior is limited to documented core fix semantics.
Meter: Manifest and integration test inspecting registered formatting providers and invoking Format Document, Format Selection, quick fixes, and fix-all commands on eligible and ineligible documents.
Fail: The extension registers a formatter that performs undocumented whole-document changes, applies fixes outside a requested safe scope, or advertises unsupported formatting behavior.
Goal: 100% of formatting-related contributions either map to documented core fixes or are absent.
Stakeholders: Markdown authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [NoUnsafeFormatting user requirement](../user/fixes-formatting.md); [Fix](../../../../packages/core/src/domain/linting/Fix.ts).
```

User trace: [UserMarkdownlintObsidian.NoUnsafeFormatting](../user/fixes-formatting.md)

## MarkdownlintObsidian.RuleHelp

```text
Tag: MarkdownlintObsidian.RuleHelp
Gist: Link diagnostics to rule documentation.
Ambition: Users can understand each reported rule without searching manually.
Scale: Percentage of built-in OFM, standard MD, and system rule diagnostics that resolve to the expected local or published documentation target.
Meter: Unit or integration test mapping representative rule codes from each family, unknown custom rule codes, and missing documentation targets to diagnostic code descriptions or code actions.
Fail: A built-in rule diagnostic lacks an expected documentation target, opens the wrong rule page, or custom rule diagnostics pretend to have built-in documentation.
Goal: 100% of built-in documented rule codes map to correct docs and 100% of unknown custom codes degrade gracefully.
Stakeholders: Markdown authors, repository maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [rule catalog](../../../../docs/rules/index.md); [RuleHelp user requirement](../user/fixes-formatting.md).
```

User trace: [UserMarkdownlintObsidian.RuleHelp](../user/fixes-formatting.md)
