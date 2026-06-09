---
title: "Line-ending test coverage audit - 2026-06-09"
aliases:
  - "Line-ending test coverage audit - 2026-06-09"
tags:
  - "docs"
  - "docs/audits"
  - "line-endings"
type: "audit"
status: "current"
updated: 2026-06-09
up: "[[README]]"
---

# Line-ending test coverage audit - 2026-06-09

## Scope

Audited the test suite for coverage of the line-ending fixes documented in
[[plans/issue-line-ending-gitattributes-responsive]].

The audit focused on whether tests prove the intended behavior across public
entry points, not only the internal parser and rule units.

## Findings Before Remediation

| Area | Finding | Impact |
| :--- | :--- | :--- |
| Engine text APIs | `lintText` and `fixText` had only LF examples. | In-memory editor-style callers were not directly covered for CRLF diagnostic invariance or CRLF-preserving fixes. |
| Public editor subpath | `markdownlint-obsidian/editor` had no direct CRLF tests. | The exported editor API could regress independently from the engine entry point without a focused test. |
| In-process CLI path | `runCli` had no CRLF regression test. | CLI behavior imported directly from `src/main` could drift from spawned CLI behavior. |
| Spawned CLI lint path | Existing CRLF coverage used `runLint`, not the spawned CLI. | The original GitLab-style user report was not reproduced through the same process boundary users run in CI. |
| Spawned CLI fix path | File-backed `engine.fix` preserved CRLF, but spawned `--fix` did not have a CRLF assertion. | A CLI wiring regression could rewrite CRLF files even if the lower-level engine test stayed green. |
| Dev CLI source loading | Dev CLI and direct source imports loaded `packages/core/dist` through package exports instead of current core source. | A stale ignored build artifact could make CLI tests fail or pass based on old compiled code instead of the source under test. |

## Remediation Implemented

- Added CRLF diagnostic-invariance coverage for `engine.lintText`.
- Added CRLF-preservation coverage for `engine.fixText`.
- Added CRLF diagnostic-invariance coverage for `markdownlint-obsidian/editor`
  `lintText`.
- Added CRLF-preservation coverage for `markdownlint-obsidian/editor`
  `fixText`.
- Added spawned CLI lint coverage for a CRLF Markdown file with a blockquoted
  wikilink that must not report OFM041 and a list that still reports MD032.
- Added spawned CLI `--fix` coverage proving a CRLF Markdown file remains CRLF
  after an autofix.
- Added in-process `runCli` coverage for the same CRLF blockquoted-wikilink
  regression.
- Updated the dev CLI and direct source entry point so CLI tests load the
  current core source engine, while compiled package builds still use package
  exports.

## Verification

| Check | Result |
| :--- | :--- |
| `bun test packages/core/tests/unit/engine/text.test.ts --timeout 30000` | Pass: 4 tests |
| `bun test packages/core/tests/unit/public/editor.test.ts --timeout 30000` | Pass: 2 tests |
| `bun test packages/cli/tests/integration/cli/cli.test.ts --timeout 30000` | Pass: 8 tests |
| `bun test packages/cli/tests/integration/cli/fix.test.ts --timeout 30000` | Pass: 4 tests |
| `bun run typecheck` | Pass |
| `bun run lint` | Pass with existing max-lines warnings only |
| `bun run test:dogfood:docs` | Pass |
| `bun run test:all` | Pass: core 602 tests, CLI 62 tests, extension 21 tests, and BDD smoke 40 scenarios |
| `bun run build` | Pass |
