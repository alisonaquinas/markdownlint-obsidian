---
title: "Feature Ticket Template"
aliases:
  - "Feature Ticket Template"
  - "Plans / Templates / Tickets / Feature"
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

# Feature Ticket Template

```yaml
id: FEAT-NNN
title: Short capability title
type: feature
status: draft
priority: high
phase: EN
created: YYYY-MM-DD
updated: YYYY-MM-DD
dependencies: []
```

## Goal

Describe the user-visible or maintainer-visible outcome.

## Scope

In scope:

- Item.

Out of scope:

- Item.

## Linked Requirements

| Requirement | Source |
| :--- | :--- |
| Requirement tag or name | Relative path |

## Linked BDD

| Feature | Scenario |
| :--- | :--- |
| Relative path | Scenario name |

## Child Tickets

| Ticket | Title | Status |
| :--- | :--- | :--- |
| `TASK-NNN` | Task title | `open` |

## Acceptance Criteria

- [ ] Child tickets are terminal.
- [ ] Phase gate passes.
- [ ] Tests and docs are updated.
- [ ] Retrospective is appended.

## Workflow Log

> [!INFO] Opened - YYYY-MM-DD
> Feature created in `draft`.
