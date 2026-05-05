# Feature Ticket Lifecycle

Feature tickets represent phase-level capability delivery.

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> ready
    ready --> in_progress
    in_progress --> in_review
    in_review --> done
    draft --> cancelled
    ready --> cancelled
    in_progress --> blocked
    blocked --> in_progress
    blocked --> cancelled
    in_review --> in_progress
    in_review --> cancelled
    done --> [*]
    cancelled --> [*]
```

## States

| State | Meaning | Exit |
| :--- | :--- | :--- |
| `draft` | scope and child tickets still incomplete | all links and child tickets exist |
| `ready` | specified and unblocked | first child task starts |
| `in-progress` | at least one child ticket is active | all child tickets terminal |
| `blocked` | phase cannot move because a dependency is missing | blocker resolves |
| `in-review` | implementation complete, awaiting gate evidence | gate passes |
| `done` | phase work accepted | terminal |
| `cancelled` | phase abandoned with rationale | terminal |
