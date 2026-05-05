# Task Ticket Lifecycle

Task tickets use a strict test-first lifecycle for behavior changes.

```mermaid
stateDiagram-v2
    [*] --> open
    open --> red
    red --> green
    green --> refactor
    green --> in_review
    refactor --> in_review
    in_review --> done
    open --> blocked
    red --> blocked
    green --> blocked
    refactor --> blocked
    blocked --> open
    blocked --> red
    blocked --> green
    blocked --> refactor
    open --> cancelled
    red --> cancelled
    green --> cancelled
    refactor --> cancelled
    in_review --> cancelled
    done --> [*]
    cancelled --> [*]
```

## Rules

- `red` means a failing test or verification check exists.
- `green` means implementation passes that check.
- `refactor` cannot change behavior.
- `done` requires phase gate evidence.
