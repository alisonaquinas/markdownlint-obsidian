# Extension Ticket Templates

Reusable ticket shapes for executing the extension roadmap. These templates
adapt the Flavor Grenade ticket model to `extension/docs/plans` and keep
extension planning separate from the core package roadmap.

## Templates

| Template | Type | Use |
| :--- | :--- | :--- |
| [feature](feature.md) | `FEAT` | phase-sized capability with child tickets |
| [task](task.md) | `TASK` | test-first implementation work |
| [bug](bug.md) | `BUG` | confirmed defect or regression |
| [chore](chore.md) | `CHORE` | process, docs, CI, or maintenance work |
| [spike](spike.md) | `SPIKE` | time-boxed decision or research work |

## ID Convention

Use `TYPE-NNN` with a global sequence per ticket type across extension plans.
Phase folders may hold tickets directly or collect them in a `tickets.md`
backlog while the phase is still being planned.

## Lifecycle Docs

| Type | Lifecycle |
| :--- | :--- |
| `FEAT` | [feature lifecycle](lifecycle/feature-lifecycle.md) |
| `TASK` | [task lifecycle](lifecycle/task-lifecycle.md) |
| `BUG` | [bug lifecycle](lifecycle/bug-lifecycle.md) |
| `CHORE` | [chore lifecycle](lifecycle/chore-lifecycle.md) |
| `SPIKE` | [spike lifecycle](lifecycle/spike-lifecycle.md) |

## Ticket Rules

- Keep ticket scope extension-only.
- Link each ticket to the phase summary and the relevant requirements or BDD
  feature.
- Add tests before implementation for non-trivial runtime behavior.
- Keep workflow logs append-only.
- Do not mark a ticket done without local gate evidence or CI evidence.
