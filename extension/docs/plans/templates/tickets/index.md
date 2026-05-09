---
title: "Extension Ticket Templates"
aliases:
  - "Extension Ticket Templates"
  - "Plans / Templates / Tickets / Index"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/templates"
  - "plans"
type: "template"
status: "current"
updated: 2026-05-09
up: "[[plans/phase-execution]]"
---

# Extension Ticket Templates

Reusable ticket shapes for executing the extension roadmap. These templates
adapt the Flavor Grenade ticket model to `extension/docs/plans` and keep
extension planning separate from the core package roadmap.

## Templates

| Template | Type | Use |
| :--- | :--- | :--- |
| [[plans/templates/tickets/feature]] | `FEAT` | phase-sized capability with child tickets |
| [[plans/templates/tickets/task]] | `TASK` | test-first implementation work |
| [[plans/templates/tickets/bug]] | `BUG` | confirmed defect or regression |
| [[plans/templates/tickets/chore]] | `CHORE` | process, docs, CI, or maintenance work |
| [[plans/templates/tickets/spike]] | `SPIKE` | time-boxed decision or research work |

## ID Convention

Use `TYPE-NNN` with a global sequence per ticket type across extension plans.
Phase folders may hold tickets directly or collect them in a `tickets.md`
backlog while the phase is still being planned.

## Lifecycle Docs

| Type | Lifecycle |
| :--- | :--- |
| `FEAT` | [[plans/templates/tickets/lifecycle/feature-lifecycle]] |
| `TASK` | [[plans/templates/tickets/lifecycle/task-lifecycle]] |
| `BUG` | [[plans/templates/tickets/lifecycle/bug-lifecycle]] |
| `CHORE` | [[plans/templates/tickets/lifecycle/chore-lifecycle]] |
| `SPIKE` | [[plans/templates/tickets/lifecycle/spike-lifecycle]] |

## Ticket Rules

- Keep ticket scope extension-only.
- Link each ticket to the phase summary and the relevant requirements or BDD
  feature.
- Add tests before implementation for non-trivial runtime behavior.
- Keep workflow logs append-only.
- Do not mark a ticket done without local gate evidence or CI evidence.
