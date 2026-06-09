---
title: "Test-Driven Development"
aliases:
  - "Test-Driven Development"
tags:
  - "docs"
  - "docs/architecture"
  - "architecture"
type: "architecture-policy"
status: "current"
updated: 2026-05-09
up: "[[architecture/README]]"
---

# Test-Driven Development

## Policy

Production behavior should enter through a failing test. No implementation work
should proceed without a red test that names the next observable capability.

## Loop

1. Red: write the smallest failing test for one behavior.
2. Green: make that behavior pass with the simplest correct implementation.
3. Refactor: improve structure while the suite stays green.

## Test Levels

| Level | Use for |
| :--- | :--- |
| Unit | Pure domain logic, value objects, parser extractors, individual rules |
| Integration | Config loading, vault bootstrap, rule registry, CLI argument flows |
| Fixture or snapshot | Markdown parsing edge cases and formatter output |
| BDD smoke | User-visible CLI workflows and cross-module behavior |

Default to unit tests. Promote to broader tests only when the behavior genuinely
spans collaborators.

## Test Quality Rules

- Test names describe behavior, not implementation mechanics.
- One assertion focus per test.
- Fixtures supply meaningful domain objects, not magic literals.
- Avoid mocks for domain logic. Mock or stub only true I/O boundaries.
- A regression fix starts with a test that fails without the fix.

## Design Signals

| Signal | Likely cause |
| :--- | :--- |
| Too many constructor or function arguments | Missing value object or config aggregate |
| Hard-to-create test data | Model coupled to infrastructure shape |
| Excessive mocking | Design organized around interactions instead of return values |
| Brittle order assertions | Test checking implementation sequence instead of outcome |

## See Also

- [SOLID Principles](solid-principles.md)
- [Linting and Tooling](linting-and-tooling.md)
