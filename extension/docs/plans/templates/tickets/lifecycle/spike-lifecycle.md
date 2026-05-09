---
title: "Spike Ticket Lifecycle"
aliases:
  - "Spike Ticket Lifecycle"
  - "Plans / Templates / Tickets / Lifecycle / Spike Lifecycle"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/templates"
  - "plans"
type: "template"
status: "current"
updated: 2026-05-09
up: "[[plans/templates/tickets/index]]"
---

# Spike Ticket Lifecycle

Spike tickets answer one time-boxed question.

```mermaid
stateDiagram-v2
    [*] --> open
    open --> in_progress
    in_progress --> concluded
    concluded --> output_delivered
    output_delivered --> done
    in_progress --> inconclusive
    in_progress --> blocked
    blocked --> in_progress
    open --> cancelled
    in_progress --> cancelled
    done --> [*]
    inconclusive --> [*]
    cancelled --> [*]
```

## Rules

- One question per spike.
- No production implementation in a spike.
- A spike must deliver an artifact or a follow-up ticket.
- `inconclusive` is valid when findings and next steps are recorded.
