# Bug Ticket Lifecycle

Bug tickets track confirmed defects.

```mermaid
stateDiagram-v2
    [*] --> open
    open --> triaged
    triaged --> in_progress
    in_progress --> in_review
    in_review --> verified
    verified --> done
    open --> duplicate
    open --> wont_fix
    triaged --> duplicate
    triaged --> wont_fix
    in_progress --> blocked
    blocked --> in_progress
    done --> [*]
    duplicate --> [*]
    wont_fix --> [*]
```

## Rules

- Reproduce before triage.
- Add a regression guard before fixing.
- Close BDD or verification gaps before `done`.
- Use `wont-fix` only with a written rationale.
