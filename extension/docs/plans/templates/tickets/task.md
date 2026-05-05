# Task Ticket Template

```yaml
id: TASK-NNN
title: Short task title
type: task
status: open
priority: medium
phase: EN
parent: FEAT-NNN
created: YYYY-MM-DD
updated: YYYY-MM-DD
dependencies: []
```

## Description

Describe one atomic unit of extension implementation work.

## Implementation Notes

- Planned files.
- Public API boundary.
- Test strategy.

## Linked Requirements

| Requirement | Source |
| :--- | :--- |
| Requirement tag or name | Relative path |

## Linked Tests

| Test | Type | Status |
| :--- | :--- | :--- |
| Path | unit, component, integration, or verification | planned |

## Definition Of Done

- [ ] Failing test or verification check exists before implementation.
- [ ] Implementation passes the linked tests.
- [ ] `bun run lint` passes.
- [ ] `bun run typecheck` passes.
- [ ] Phase gate passes.

## Workflow Log

> [!INFO] Opened - YYYY-MM-DD
> Task created in `open`.
