# Phase E5 Tickets

## FEAT-006: Workspace Commands, Config Watchers, And Trust Policy

Status: `in-review`

Goal: provide command palette workflows and explicit trust behavior for
workspace linting, config opening, temporary disable, and unsupported modes.

Linked plan: [Phase E5](../phase-e5-workspace-commands-and-trust.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-018` | task | Implement workspace lint command | `in-review` |
| `TASK-019` | task | Implement open config command | `in-review` |
| `TASK-020` | task | Implement temporary disable state | `in-review` |
| `TASK-021` | task | Implement config watchers and refresh | `in-review` |
| `TASK-022` | task | Enforce trust and unsupported mode policy | `in-review` |

Acceptance criteria:

- [ ] every command reports a result or actionable error.
- [ ] temporary disable is session-only.
- [ ] config changes refresh visible eligible diagnostics.
- [ ] untrusted custom code and unsupported workspaces fail visibly.

## TASK-018: Implement Workspace Lint Command

Scope: run bundled library lint over single-root and multi-root workspaces,
stream results to output, and avoid duplicating live diagnostic ownership
unless explicitly designed.

Done when configured globs and per-folder failures are visible.

## TASK-019: Implement Open Config Command

Scope: open the nearest supported config file or an untitled starter document
without writing automatically.

Done when existing and missing config cases are covered.

## TASK-020: Implement Temporary Disable State

Scope: pause live diagnostics for the extension session, clear diagnostics,
and re-enable cleanly.

Done when no workspace files are modified by disable or re-enable.

## TASK-021: Implement Config Watchers And Refresh

Scope: watch supported config filenames, handle create, change, and delete,
and refresh visible eligible diagnostics.

Done when watcher events update effective config deterministically.

## TASK-022: Enforce Trust And Unsupported Mode Policy

Scope: block custom rule loading and writes in untrusted contexts and report
unsupported URI or workspace modes.

Done when local, remote-like, virtual, and untrusted fixtures are covered.
