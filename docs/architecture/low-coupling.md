---
title: "Low Coupling"
aliases:
  - "Low Coupling"
tags:
  - "docs"
  - "docs/architecture"
  - "architecture"
type: "architecture-policy"
status: "current"
updated: 2026-05-09
up: "[[architecture/README]]"
---

# Low Coupling

## Policy

Dependencies are explicit, narrow, stable, and acyclic. Changes to one module
should not ripple through unrelated modules.

## Coupling Controls

### Structural Coupling

| Rule | Rationale |
| :--- | :--- |
| No import cycles between layers | Cycles make change order unpredictable |
| Domain modules never import infrastructure | Domain depends on contracts, not concrete I/O |
| Cross-package consumers use public exports | Internals remain movable |
| Prefer immutable values at boundaries | Avoid action at a distance |

### Contract Coupling

| Rule | Rationale |
| :--- | :--- |
| Interfaces define cross-boundary behavior | Consumers depend on stable contracts |
| Config shape is validated before use | Downstream code can trust inputs |
| Formatters own output serialization | Application use cases stay formatter-neutral |
| Editor adapters own VS Code translation | Core does not know editor APIs |

### Temporal Coupling

Avoid hidden ordering dependencies. If a rule needs vault context, make the
nullable `vault` or `blockRefIndex` dependency explicit in `RuleParams`. If
configuration must be loaded before linting, keep that sequencing in the
application or adapter layer.

### Operational Coupling

- No hidden singleton state for lint behavior.
- No implicit network access.
- File I/O stays in infrastructure or editor adapters.
- Thread or process assumptions must be documented if introduced.

## Measurement Signals

| Signal | Healthy |
| :--- | :--- |
| Import cycles | 0 |
| Domain imports from infrastructure | 0 |
| Co-change spread | Most changes localized to one bounded area |
| Fan-out | Low enough to understand in one review |
