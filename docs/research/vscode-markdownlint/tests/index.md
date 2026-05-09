---
title: "vscode-markdownlint Unit Test Catalog"
aliases:
  - "vscode-markdownlint Unit Test Catalog"
tags:
  - "research/vscode"
  - "research/markdownlint"
  - "research/tests"
  - "docs"
  - "docs/research"
  - "docs/research/vscode-markdownlint"
type: "research"
status: "current"
updated: 2026-05-04
up: "[[research/vscode-markdownlint/technical-stack]]"
sources:
  - https://github.com/DavidAnson/vscode-markdownlint/tree/main/test
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/test/metadata-test.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/test/stringify-error-test.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/test-ui/tests.cjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/package.json
---

# vscode-markdownlint Unit Test Catalog

## Scope

This catalog covers the unit tests in David Anson's `vscode-markdownlint`
repository under `test/`, checked from upstream `main` on 2026-05-04.

It does not catalog `test-ui/` as unit tests. Those are VS Code UI/integration
tests run separately by `npm run test-ui`.

## Test Runner

The unit tests use Node's built-in test runner:

```bash
node --test --experimental-test-coverage
```

Upstream's full `npm test` script also runs linting, webpack compilation,
schema generation checks, and `git diff --exit-code`.

## Summary

| File | Suite | Named tests | Assertion plan |
|---|---|---:|---:|
| `test/metadata-test.mjs` | `metadata` | 1 | 291 |
| `test/stringify-error-test.mjs` | `stringify-error` | 15 | 15 |
| Total | | 16 | 306 |

## `test/metadata-test.mjs`

Suite: `metadata`

| Test | Purpose | Assertions |
|---|---|---:|
| `version numbers match` | Checks that Markdownlint and Markdownlint CLI2 version references in project metadata agree with installed package versions. Also checks that the first changelog version matches the extension package version at major/minor level. | 291 |

Files read by the test:

- `package.json`
- `CHANGELOG.md`
- `README.md`
- `markdownlint-cli2-config-schema.json`
- `markdownlint-config-schema.json`
- `node_modules/markdownlint/package.json`

Version references checked:

- `markdownlint-cli2` links must match the `markdownlint-cli2` dependency
  version from `package.json`.
- `markdownlint` links must match the installed `markdownlint` package version.
- The first changelog entry must match the extension package version after
  ignoring patch version differences.

## `test/stringify-error-test.mjs`

Suite: `stringify-error`

These tests cover `stringify-error.mjs`, a helper that normalizes thrown values
and error-like objects into predictable multiline text.

| Test | Input shape | Expected behavior |
|---|---|---|
| `null` | `null` | Emits `[NO NAME]`, serialized `null`, and `[NO STACK]`. |
| `number` | Number primitive | Emits `[NO NAME]`, serialized number, and `[NO STACK]`. |
| `string` | String primitive | Emits `[NO NAME]`, JSON string value, and `[NO STACK]`. |
| `object` | Empty object | Emits `[NO NAME]`, serialized object, and `[NO STACK]`. |
| `Error-like, name` | Object with `name` only | Uses the provided name and serializes the object as message text. |
| `Error-like, name/message` | Object with `name` and `message` | Uses both fields and emits `[NO STACK]`. |
| `Error-like, name/message/stack` | Object with explicit stack | Emits stack lines under a `stack:` section. |
| `Error-like, name/message/stack-with-heading` | Stack starts with duplicate error heading | Removes the duplicate heading before emitting stack lines. |
| `Error-like, name/message/cause` | Object with nested `cause` | Emits the primary error and indented nested cause. |
| `Error-like, name/message/errors-none` | Object with empty `errors` array | Suppresses the empty `errors` section. |
| `Error-like, name/message/errors-one` | Object with one nested error | Emits one indented `errors:` entry. |
| `Error-like, name/message/errors-two` | Object with nested object and string error | Emits both nested errors with stable formatting. |
| `Error-like, name/message/errors-nested` | Nested `cause` and nested `errors` | Preserves recursive cause/error structure with increasing indentation. |
| `Error, cause` | Native `Error` with `cause` | Normalizes stack output and emits the nested native cause. |
| `AggregateError, nested` | Native nested `AggregateError` | Emits nested aggregate errors recursively. |

Each `stringify-error` test has `t.plan(1)` and compares the complete formatted
string with `t.assert.equal`.

## VS Code UI Smoke Coverage

The `test-ui/tests.cjs` smoke suite exercises selected extension-host behavior.
It is not a complete functional test catalog, but it provides direct evidence
for several user-facing flows:

| Test helper | Covered behavior |
|---|---|
| `openLintEditVerifyFixAll` | Opens `README.md`, creates `MD019` and `MD012`, verifies diagnostic code, target, message, range, severity, source, then runs `markdownlint.fixAll`. |
| `openLintEditCloseClean` | Opens `README.md`, creates diagnostics, closes the active editor, and verifies diagnostics are cleaned up. |
| `addNonDefaultViolation` | Adds a non-default `MD054` violation and verifies the diagnostic appears. |
| `openEditDiffRevert` | Edits and saves `CHANGELOG.md`, opens a Git diff view, undoes changes, saves, and closes editors. |
| `dynamicWorkspaceSettingsChange` | Updates workspace `markdownlint.customRules`, verifies custom-rule diagnostics appear, then removes the setting. |
| `lintWorkspace` | Runs `markdownlint.lintWorkspace` and verifies the expected VS Code terminal is opened. |

## Notes For Flavor Grenade

The upstream unit test surface is narrow. Most behavior validation lives outside
unit tests:

- linting and metadata consistency are enforced inside `npm test`;
- some extension behavior is covered through `test-ui/`: diagnostics, fix-all,
  diagnostic cleanup on close, non-default configuration, dynamic workspace
  settings, and workspace-lint terminal creation;
- package correctness is partly enforced by generated schema diffs.

For Flavor Grenade's extension, this suggests keeping small pure unit tests for
client helpers, but relying on VS Code integration tests for language-client
startup, command wiring, server process behavior, diagnostics, and status UI.
