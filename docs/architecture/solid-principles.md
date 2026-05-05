---
title: SOLID Principles
---

# SOLID Principles

## Policy

Use SOLID as change-driven heuristics, not doctrinal ceremony. Apply each
principle where it reduces the cost of likely changes in lint rules, parsing,
configuration, adapters, and editor integrations.

## Single Responsibility

Ask: what independent change requests hit this unit?

| Unit | Responsibility | Violation signal |
| :--- | :--- | :--- |
| OFM rule | Detect one rule family violation and optional safe fix | Rule owns parsing, I/O, or unrelated policy |
| Parser extractor | Extract one OFM construct from Markdown text | Extractor validates rule semantics |
| Config loader | Discover, read, merge, and validate config | Loader runs lint rules or formats output |
| Formatter | Render `LintResult[]` into one output format | Formatter mutates lint results |

## Open/Closed

Known extension points should accept new behavior without editing core
orchestration:

- new OFM rules through the rule registry;
- custom rules through public rule APIs;
- output formatters through the formatter registry;
- filesystem adapters through domain interfaces;
- future editor clients through adapter boundaries.

Do not extract extension points speculatively.

## Liskov Substitution

Any implementation of a domain interface must be usable without call-site
special cases. If a caller must ask which implementation it received, the
interface is probably too wide or underspecified.

## Interface Segregation

Keep interfaces role-focused:

- rules receive `RuleParams`, not infrastructure services;
- file existence checks stay behind `FileExistenceChecker`;
- formatters consume immutable lint results;
- extension adapters should not depend on CLI-only concerns.

## Dependency Inversion

Dependency direction:

```text
Domain logic
    depends on abstractions and value objects
Application orchestration
    depends on domain contracts
Infrastructure and editor adapters
    implement contracts and perform I/O
```

Domain modules must not import infrastructure, application, Node filesystem, VS
Code APIs, or process-level concerns.

## Anti-Patterns

- One interface per class without a real variation point.
- Replacing a clear conditional with a hierarchy that hides the rule.
- Splitting cohesive logic so aggressively that behavior becomes scattered.
- Treating dependency injection as DIP when dependencies still point outward.
