---
title: "vscode-markdownlint Functional Requirements - Contributions And Trust"
aliases:
  - "vscode-markdownlint Functional Requirements - Contributions And Trust"
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
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/snippets.json
---

# Contributions And Trust

## Markdownlint.ManifestContributions

```text
Tag: Markdownlint.ManifestContributions
Gist: Contribute commands, menus, task definitions, problem matchers, configuration, snippets, and schema validation to VS Code.
Ambition: VS Code exposes markdownlint functionality through native extension contribution points.
Scale: Percentage of manifest contribution points present with the source-defined ids, titles, conditions, defaults, scopes, and paths.
Meter: Manifest inspection test against `package.json` for commands, command-palette menu conditions, task definition, problem matcher, configuration properties, JSON validation, YAML validation, and Markdown snippets.
Fail: Any source-defined contribution is missing, renamed, scoped incorrectly, points to the wrong file, or has a changed default without a corresponding intentional versioned change.
Goal: 100% manifest contribution match.
Stakeholders: Markdown authors, VS Code users, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `package.json` `contributes`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.SchemaValidation

```text
Tag: Markdownlint.SchemaValidation
Gist: Attach markdownlint schemas to JSON and YAML configuration files.
Ambition: Users receive editor validation while authoring markdownlint configuration.
Scale: Percentage of supported config filenames that receive the correct contributed schema URL.
Meter: Manifest inspection and VS Code smoke test for `.markdownlint.json`, `.markdownlint.jsonc`, `.markdownlint.yaml`, `.markdownlint.yml`, `.markdownlint-cli2.jsonc`, and `.markdownlint-cli2.yaml`.
Fail: Any supported JSON or YAML config file lacks schema validation or points to the wrong schema.
Goal: 100% of supported JSON and YAML config filenames receive the expected schema.
Stakeholders: Markdown authors, workspace maintainers.
Owner: vscode-markdownlint extension.
Source: `package.json` `jsonValidation` and `yamlValidation`.
```

Test trace: [[research/vscode-markdownlint/tests/index#test/metadata-test.mjs|metadata unit test]]

## Markdownlint.Snippets

```text
Tag: Markdownlint.Snippets
Gist: Provide Markdown snippets for inline markdownlint suppression and configuration comments.
Ambition: Users can insert correct markdownlint control comments through IntelliSense.
Scale: Percentage of source-defined snippet prefixes available for Markdown documents with the expected body and description.
Meter: Manifest and snippet-file inspection test plus VS Code Markdown IntelliSense smoke test.
Fail: Any source-defined snippet is missing, available for the wrong language, or expands to a different control-comment form.
Goal: 100% of source-defined snippets are available for `markdown`.
Stakeholders: Markdown authors.
Owner: vscode-markdownlint extension.
Source: `package.json` snippet contribution; `snippets.json`; README `Snippets`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.WorkspaceTrust

```text
Tag: Markdownlint.WorkspaceTrust
Gist: Block JavaScript imports for custom rules, markdown-it plugins, and configuration files when the workspace or document context is not trusted for imports.
Ambition: Linting still runs in limited environments while JavaScript loading is disabled.
Scale: Percentage of lint invocations where `noImport` is true when the workspace is untrusted, the URI scheme is not `file`, or the runtime is not desktop; and false only when all import-enabling conditions are satisfied.
Meter: Unit or integration test covering trusted file desktop workspace, untrusted workspace, untitled document, virtual workspace, gist document, and web runtime.
Fail: JavaScript imports are allowed in any source-defined blocked context, or blocked in the trusted local desktop file context.
Goal: 100% of lint invocations set `noImport` according to source behavior.
Stakeholders: Markdown authors, security reviewers, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `package.json` `capabilities`; `extension.mjs` `getNoImport`; README `Security`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]

## Markdownlint.FileSystemAdapter

```text
Tag: Markdownlint.FileSystemAdapter
Gist: Present VS Code workspace file systems to markdownlint-cli2 through a Node-like `fs` adapter.
Ambition: The lint engine can read configuration and workspace files through VS Code APIs across supported file-system-like schemes.
Scale: Percentage of markdownlint file-system operations used by the extension that are implemented by `vscode.workspace.fs` or intentionally rejected by the null adapter for independent documents.
Meter: Unit or integration test for `access`, `readdir`, `readFile`, `stat`, `lstat`, and promise variants against file, virtual-like, Windows drive-letter, network-share, and independent document contexts.
Fail: A supported file-system operation cannot be performed through the adapter, returns incompatible stat/dirent shape, or independent documents accidentally probe workspace files.
Goal: 100% of required file-system operations match markdownlint-cli2 expectations for supported contexts.
Stakeholders: Markdown authors, remote workspace users, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `extension.mjs` `FsWrapper`, `FsNull`, `markdownlintWrapper`.
```

Test trace: [[research/vscode-markdownlint/tests/index#VS Code UI Smoke Coverage|VS Code UI smoke coverage]]
