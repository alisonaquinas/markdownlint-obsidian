---
title: "Phase E4: Fixes And Rule Help"
aliases:
  - "Phase E4: Fixes And Rule Help"
  - "Plans / Phase E4 Fixes And Rule Help"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e4-fixes-and-rule-help"
  - "plans"
  - "phase/e4"
type: "plan"
status: "current"
updated: 2026-05-09
up: "[[plans/index]]"
---

# Phase E4: Fixes And Rule Help

## Goal

Expose core-provided fixes and rule documentation through VS Code code actions
without presenting lint fixes as a general Markdown formatter.

## Scope

- quick fixes for diagnostics with core fix payloads.
- source fix-all for the current eligible document.
- no-write fix preview command.
- rule documentation links.
- stale edit rejection.
- formatting boundary enforcement.

## Behavior Slice

An author sees a markdownlint-obsidian diagnostic, opens the light bulb, applies
a safe quick fix, and can open rule documentation for context.

## Implementation Tasks

- [ ] Implement a code action provider for markdownlint-obsidian diagnostics.
- [ ] Translate one core `Fix` into a VS Code `WorkspaceEdit`.
- [ ] Reject stale fixes when document version or range assumptions changed.
- [ ] Implement fix-all for all non-conflicting fixes in the active eligible
  document.
- [ ] Implement a fix preview command that mirrors core check mode without
  writing files.
- [ ] Map built-in OFM, system, and standard Markdown rule codes to docs.
- [ ] Degrade gracefully for unknown custom rule codes.
- [ ] Avoid registering document formatting unless the behavior maps to
  documented safe core fixes.
- [ ] Add unit, component, and extension-host tests for code actions.

## Test Plan

| Scenario | Evidence |
| :--- | :--- |
| quick fix available | diagnostic with fix payload offers preferred action |
| quick fix applies | resulting text matches core fix edit |
| stale fix rejected | changed document receives no unsafe edit |
| fix all applies safe fixes | non-conflicting fixes apply, non-fixable diagnostics remain |
| fix preview no write | files are reported but not modified |
| rule help | built-in rule opens expected docs target |
| custom rule help | unknown custom rule does not claim built-in docs |
| formatting boundary | unsupported Format Document produces no hidden rewrite |

## Verification

```bash
bun --cwd extension test tests/unit/fixes
bun --cwd extension test tests/component/fix-workflow
bun --cwd extension run test:integration -- --grep code-actions
bun run lint
```

## Acceptance Criteria

- code actions are offered only for markdownlint-obsidian diagnostics.
- all edits stay within core-provided fix semantics.
- stale or invalid fix payloads do not change documents.
- fix preview never writes files.
- built-in rule docs open correctly.
- formatting behavior is absent or explicitly safe.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Core fix payload lacks enough version context | store document version with diagnostics and reject mismatches |
| Multiple edits overlap after document changes | re-run core fix path for fix-all or rely on core conflict handling |
| Rule docs move during packaging | add metadata consistency checks and package docs targets intentionally |

## Exit Criteria

E4 exits when quick fix, fix-all, fix preview, and rule-help flows pass
extension-host tests and preserve the formatting boundary.
