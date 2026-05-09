---
title: "Bug Ticket Template"
aliases:
  - "Bug Ticket Template"
  - "Plans / Templates / Tickets / Bug"
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

# Bug Ticket Template

```yaml
id: BUG-NNN
title: Short defect title
type: bug
status: open
priority: medium
severity: medium
phase: EN
introduced-in: EN
created: YYYY-MM-DD
updated: YYYY-MM-DD
dependencies: []
```

## Summary

State what is broken, what input triggers it, and the wrong result.

## Reproduction

1. Step.
2. Step.
3. Step.

## Expected

Expected result.

## Actual

Actual result.

## Regression Guard

- [ ] Failing regression test exists.
- [ ] Fix passes all linked tests.
- [ ] BDD or verification coverage is updated if needed.

## Workflow Log

> [!INFO] Opened - YYYY-MM-DD
> Bug created in `open`.
