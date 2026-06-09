---
title: "vscode-markdownlint User Requirements - Workspace And Trust"
aliases:
  - "vscode-markdownlint User Requirements - Workspace And Trust"
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
  - ../functional/workspace-commands.md
  - ../functional/contributions-and-trust.md
  - ../functional/test-derived.md
  - ../../tests/index.md
---

# Workspace And Trust

```text
Tag: UserMarkdownlint.WorkspaceLint
Need: As a repository maintainer, I need to lint all configured Markdown files in the workspace from VS Code, so I can check repository-wide Markdown quality without leaving the editor.
Derived from: Markdownlint.WorkspaceLint; test-ui lintWorkspace smoke coverage.
Acceptance cue: `markdownlint.lintWorkspace` runs a VS Code task for each workspace folder, uses configured globs, emits terminal output, and contributes results through the markdownlint problem matcher.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/workspace-commands#Markdownlint.WorkspaceLint|Markdownlint.WorkspaceLint]]

```text
Tag: UserMarkdownlint.TemporaryDisable
Need: As a Markdown author, I need to pause and resume lint diagnostics temporarily, so I can work through large edits without changing persistent repository or user settings.
Derived from: Markdownlint.ToggleLinting.
Acceptance cue: `markdownlint.toggleLinting` clears current diagnostics when disabled, re-lints visible Markdown when enabled, and resets to enabled in a new workspace session.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/workspace-commands#Markdownlint.ToggleLinting|Markdownlint.ToggleLinting]]

```text
Tag: UserMarkdownlint.RemoteAndVirtualWorkspaces
Need: As a remote or browser-based VS Code user, I need Markdown linting to work where VS Code exposes a supported workspace file system, so editor feedback is not limited to local disk files.
Derived from: Markdownlint.DocumentEligibility; Markdownlint.FileSystemAdapter; Markdownlint.WorkspaceTrust.
Acceptance cue: Supported virtual or remote schemes are linted through `vscode.workspace.fs`; independent documents avoid probing unavailable workspace files.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.DocumentEligibility|Markdownlint.DocumentEligibility]], [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.FileSystemAdapter|Markdownlint.FileSystemAdapter]], [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.WorkspaceTrust|Markdownlint.WorkspaceTrust]]

```text
Tag: UserMarkdownlint.TrustedJavaScript
Need: As a security-conscious user, I need JavaScript-based custom rules, plugins, and config files to be blocked outside trusted local desktop file contexts, so linting does not silently execute workspace code in unsafe environments.
Derived from: Markdownlint.WorkspaceTrust.
Acceptance cue: `noImport` is true for untrusted workspaces, non-file schemes, and non-desktop runtimes; imports are allowed only when all source-defined trust conditions are satisfied.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.WorkspaceTrust|Markdownlint.WorkspaceTrust]]

```text
Tag: UserMarkdownlint.ActionableErrors
Need: As a Markdown author or maintainer, I need linting exceptions to be reported in understandable output, so I can troubleshoot broken configuration, custom rules, or workspace lint failures.
Derived from: Markdownlint.ErrorSerialization.
Acceptance cue: Exceptions are serialized deterministically, including nested causes and aggregate errors, before being written to the output channel or workspace lint terminal.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/test-derived#Markdownlint.ErrorSerialization|Markdownlint.ErrorSerialization]]

```text
Tag: UserMarkdownlint.MetadataConfidence
Need: As an extension user or maintainer, I need published README, changelog, package, and schema references to match the bundled markdownlint versions, so documentation links describe the rules actually being used.
Derived from: Markdownlint.MetadataConsistency.
Acceptance cue: Version references checked by upstream unit tests match the installed `markdownlint-cli2` dependency and transitive `markdownlint` package.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/test-derived#Markdownlint.MetadataConsistency|Markdownlint.MetadataConsistency]]
