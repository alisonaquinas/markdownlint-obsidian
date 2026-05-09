---
title: "Phase E5: Workspace Commands And Trust"
aliases:
  - "Phase E5: Workspace Commands And Trust"
  - "Plans / Phase E5 Workspace Commands And Trust"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e5-workspace-commands-and-trust"
  - "plans"
  - "phase/e5"
type: "plan"
status: "current"
updated: 2026-05-09
up: "[[plans/index]]"
---

# Phase E5: Workspace Commands And Trust

## Goal

Deliver command palette workflows and trust policy so maintainers can lint and
manage vault feedback from VS Code without silent failures.

## Scope

- workspace lint command.
- open config command.
- temporary enable or disable live diagnostics.
- configuration watchers.
- output channel.
- workspace trust policy.
- custom rule loading policy.
- local, remote, virtual, and unsupported workspace behavior.

## Behavior Slice

A maintainer runs workspace lint, sees output for each workspace folder, opens
configuration from the command palette, and can temporarily pause live
diagnostics during large edits.

## Implementation Tasks

- [ ] Implement workspace lint command for single-root and multi-root
  workspaces.
- [ ] Stream workspace lint results to an output channel and optionally publish
  Problems diagnostics where appropriate.
- [ ] Implement open config command with nearest existing file or untitled
  `.obsidian-linter.jsonc` starter.
- [ ] Implement temporary disable and re-enable state for the extension
  session.
- [ ] Add watchers for supported config file names.
- [ ] Refresh visible eligible diagnostics when relevant config changes.
- [ ] Enforce workspace trust before custom rule loading and file writes.
- [ ] Report unsupported URI and workspace modes explicitly.
- [ ] Add command-level error handling for all command paths.
- [ ] Add extension-host tests for commands, watchers, and trust behavior.

## Test Plan

| Scenario | Evidence |
| :--- | :--- |
| workspace lint single root | configured globs and ignores are honored |
| workspace lint multi-root | every folder reports result or actionable error |
| open config existing | nearest supported config opens |
| open config missing | starter draft opens without writing automatically |
| temporary disable | diagnostics clear and config files remain untouched |
| re-enable | visible eligible files are linted again |
| config watcher | create, change, and delete refresh diagnostics |
| untrusted custom rules | custom modules are blocked with clear output |
| unsupported workspace | file-system operation is rejected intentionally |

## Verification

```bash
bun --cwd extension test tests/unit/commands
bun --cwd extension test tests/component/workspace-commands
bun --cwd extension run test:integration -- --grep commands
bun --cwd extension run test:integration -- --grep trust
```

## Acceptance Criteria

- every command reports a result or actionable error.
- temporary disable is session-only.
- workspace trust blocks custom executable code in untrusted contexts.
- configuration changes refresh visible eligible diagnostics.
- unsupported modes fail visibly instead of probing or writing unexpectedly.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Workspace lint duplicates live diagnostic state | keep command output separate unless a Problems integration is explicitly designed |
| Multi-root behavior creates ambiguous config ownership | resolve config per workspace folder and document output scope |
| Core config parity expands supported filenames | derive watcher and open-config coverage from core-supported discovery names |
| Remote or virtual workspaces need VS Code file APIs | start with explicit rejection policy and add support only with tests |

## Exit Criteria

E5 exits when workspace commands, trust policy, and config watchers pass
extension-host tests in representative workspace fixtures.
