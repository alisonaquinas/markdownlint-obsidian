---
title: "vscode-markdownlint User Requirements - Editing Feedback"
aliases:
  - "vscode-markdownlint User Requirements - Editing Feedback"
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
  - ../functional/editing-linting.md
  - ../../tests/index.md
---

# Editing Feedback

```text
Tag: UserMarkdownlint.AutomaticActivation
Need: As a Markdown author, I need linting to become available automatically when I open or edit a Markdown document, so I do not have to start a separate tool before writing.
Derived from: Markdownlint.Activation.
Acceptance cue: Opening a document with VS Code language id `markdown` activates markdownlint commands, providers, and diagnostics.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.Activation|Markdownlint.Activation]]

```text
Tag: UserMarkdownlint.RelevantDocuments
Need: As a Markdown author, I need linting to apply only to documents that VS Code treats as Markdown and that markdownlint can safely inspect, so unrelated editors and unsupported schemes are not noisy or broken.
Derived from: Markdownlint.DocumentEligibility.
Acceptance cue: Supported file, untitled, remote, web-test, and gist Markdown documents are eligible; unsupported schemes and non-Markdown language ids are ignored.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.DocumentEligibility|Markdownlint.DocumentEligibility]]

```text
Tag: UserMarkdownlint.CurrentDiagnostics
Need: As a Markdown author, I need lint diagnostics to stay current as I open, edit, save, close, and reconfigure documents, so the Problems panel and editor underlines reflect the current document state.
Derived from: Markdownlint.LintTrigger; Markdownlint.Diagnostics.
Acceptance cue: Diagnostics appear, update, clear, or disappear according to document lifecycle events, configured run mode, severity settings, and stale-result protection.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.LintTrigger|Markdownlint.LintTrigger]], [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.Diagnostics|Markdownlint.Diagnostics]]

```text
Tag: UserMarkdownlint.FocusWhileTyping
Need: As a Markdown author, I need the option to hide diagnostics on or near my cursor, so transient lint warnings do not interrupt focused editing.
Derived from: Markdownlint.FocusMode.
Acceptance cue: `markdownlint.focusMode` suppresses diagnostics within the configured cursor line band and leaves diagnostics outside that band visible.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.FocusMode|Markdownlint.FocusMode]]

```text
Tag: UserMarkdownlint.RunModeControl
Need: As a Markdown author, I need to choose whether linting runs while typing or only on save, so lint feedback matches my tolerance for immediate feedback.
Derived from: Markdownlint.LintTrigger.
Acceptance cue: `markdownlint.run: onType` lints after edits, while `markdownlint.run: onSave` lints after saves.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.LintTrigger|Markdownlint.LintTrigger]]
