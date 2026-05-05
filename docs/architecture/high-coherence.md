---
title: High Coherence
---

# High Coherence

## Policy

Every module, package, and namespace should tell one consistent design story.
Related behavior lives together. Unrelated behavior lives apart.

## Coherence Levels

### Conceptual Coherence

One term means one thing everywhere. `Wikilink`, `Embed`, `Vault`, `Rule`,
`Fix`, and `LintResult` should not drift between docs, code, and tests.

### Module Coherence

Each module has one focused responsibility and one primary reason to change.

| Smell | Fix |
| :--- | :--- |
| Generic utility module with unrelated helpers | Split by domain concept |
| Rule reaching into parser internals | Move projection to parser/domain model |
| Formatter changing lint semantics | Move behavior to rule or use case |
| Extension code reimplementing core rules | Call core API instead |

### Architectural Coherence

Dependency direction is explicit and acyclic. Domain is inward. Infrastructure,
CLI, action, and extension adapters sit outside the domain.

### Runtime Coherence

The runtime call graph should match the intended architecture. If the domain is
stateless, no domain code should accumulate hidden process state. If the vault
index is the resolution boundary, no rule should bypass it with ad hoc I/O.

## What Coherence Is Not

- Not uniform formatting. Formatting is a tooling concern.
- Not maximal splitting. A cohesive 200-line file is better than five coupled
  fragments.
- Not deduplication at all costs. Similar code can stay separate if it changes
  for different reasons.
