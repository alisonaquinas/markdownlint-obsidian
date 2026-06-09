---
title: "Extension Phase Execution Procedure"
aliases:
  - "Extension Phase Execution Procedure"
  - "Plans / Phase Execution"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-execution"
  - "plans"
type: "procedure"
status: "current"
updated: 2026-05-09
up: "[[plans/index]]"
---

# Extension Phase Execution Procedure

This procedure adapts Flavor Grenade's phase execution model for the
`markdownlint-obsidian` VS Code extension. It applies only to work under
`extension/docs/plans` and the extension package.

## Rule 1: Execute Phases Sequentially

Run extension phases in roadmap order:

```text
E0 -> E1 -> E2 -> E3 -> E4 -> E5 -> E6 -> E7
```

Do not start an implementation phase until the previous phase gate is passing.
E4 and E5 may be planned in parallel after E3, but implementation should still
avoid touching the same source files at the same time.

## Rule 2: Tickets Own Work

All implementation, cleanup, and defect work should map to a ticket in the
current phase folder. If a gate failure or review finding appears during a
phase, create or update a ticket before fixing it.

## Rule 3: Use The Ticket Lifecycle

Ticket states are defined in [[plans/templates/tickets/index]].
Runtime behavior tasks use `open -> red -> green -> refactor -> in-review ->
done`. Documentation and process work may use chore lifecycle states.

## Rule 4: Keep Extension Boundaries Intact

- Extension code depends on the bundled `markdownlint-obsidian` library, not
  the CLI.
- Automatic lint eligibility comes from Flavor Grenade's `ofmarkdown` language
  id.
- Core lint rule semantics remain in the core package.
- VS Code-specific code stays in the extension package.

## Rule 5: Phase Checklist

Every phase follows this checklist:

| Step | Action | Evidence |
| :--- | :--- | :--- |
| A | Review phase summary and backlog | phase folder `README.md` and `tickets.md` |
| B | Fill placeholders and resolve blockers | updated tickets |
| C | Add implementation detail to active tickets | file paths, tests, APIs |
| D | Execute tasks test-first | red and green evidence |
| E | Run lint and type gates | command output or CI |
| F | Run unit, component, integration, or verification gates | command output or CI |
| G | Update docs, traceability, and automation notes | linked docs |
| H | Add retrospective to the phase feature ticket | workflow log entry |

## Phase Gates

| Phase | Minimum Gate |
| :--- | :--- |
| E0 | `bun run test:dogfood:extension-docs` |
| E1 | `bun run lint`, `bun run typecheck`, `bun --cwd extension test` |
| E2 | E1 gate plus adapter and config unit/component tests |
| E3 | E2 gate plus diagnostics extension-host smoke tests |
| E4 | E3 gate plus code action and fix workflow tests |
| E5 | E3 gate plus command, watcher, and trust tests |
| E6 | `bun run test:all`, `bun run test:dogfood`, package inspection |
| E7 | E6 gate plus manual validation matrix and release dry run |

## Completion Rule

A phase is complete only when all planned tickets are terminal, the phase gate
passes, and the phase feature ticket records a retrospective.
