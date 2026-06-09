---
title: "Phase E0 Tickets"
aliases:
  - "Phase E0 Tickets"
  - "Plans / Phase E0 Planning Readiness / Tickets"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e0-planning-readiness"
  - "plans"
  - "phase/e0"
type: "ticket-list"
status: "current"
updated: 2026-05-09
up: "[[plans/phase-e0-planning-readiness]]"
---

# Phase E0 Tickets

## FEAT-001: Planning Baseline Ready For Extension Implementation

Status: `in-review`

Goal: finish the documentation baseline that lets E1 start without guessing
package location, runtime dependency policy, or test gates.

Linked plan: [[plans/phase-e0-planning-readiness]]

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-001` | task | Finalize extension runtime ADRs | `in-review` |
| `TASK-002` | task | Confirm requirements to BDD traceability | `in-review` |
| `CHORE-001` | chore | Run extension docs planning gate | `in-review` |

Acceptance criteria:

- [x] unresolved runtime decisions are recorded as ADRs or explicit E1 tasks.
- [x] requirements, BDD, DDD, architecture, and tests remain linked.
- [x] `bun run test:dogfood:extension-docs` passes.

## TASK-001: Finalize Extension Runtime ADRs

Scope: decide whether E1 needs ADRs for package location, build tool, and
library adapter boundary.

Reviewed files:

- `extension/docs/adr/`
- `extension/docs/plans/phase-e1-package-scaffold.md`
- `extension/docs/plans/phase-e1-package-scaffold/tickets.md`

Done when ADR gaps are closed or converted into E1 tasks.

## TASK-002: Confirm Requirements To BDD Traceability

Scope: review extension user, functional, technical, BDD, and test docs for
missing implementation-entry links.

Done when every E1-facing requirement has either a BDD scenario, test-plan row,
or explicit implementation gap.

## CHORE-001: Run Extension Docs Planning Gate

Scope: verify the phase planning docs after ticket folder creation.

Gate:

```bash
bun run test:dogfood:extension-docs
```

Done when the gate passes and any lint findings have their own ticket or fix.
