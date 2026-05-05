# Chore Ticket Lifecycle

Chore tickets cover maintenance, docs, process, CI, and metadata work.

```mermaid
stateDiagram-v2
    [*] --> open
    open --> in_progress
    in_progress --> in_review
    in_review --> done
    open --> cancelled
    in_progress --> blocked
    blocked --> in_progress
    blocked --> cancelled
    in_review --> in_progress
    done --> [*]
    cancelled --> [*]
```

## Rules

- Keep chores non-behavioral.
- Declare scope before editing.
- Convert to `TASK` if runtime behavior changes.
- Record gate evidence before `done`.
