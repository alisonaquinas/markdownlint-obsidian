---
title: "Namespace and Module Structure"
aliases:
  - "Namespace and Module Structure"
tags:
  - "docs"
  - "docs/architecture"
  - "architecture"
type: "architecture-policy"
status: "current"
updated: 2026-05-09
up: "[[architecture/README]]"
---

# Namespace and Module Structure

## Policy

Directories are coherence boundaries. Each package, folder, and module should
map to one domain or adapter concept.

## Current Top-Level Boundaries

| Path | Boundary |
| :--- | :--- |
| `packages/core/src/domain/` | Pure domain contracts and value objects |
| `packages/core/src/application/` | Use cases and orchestration |
| `packages/core/src/infrastructure/` | Parsers, config, filesystem, rules, formatters, vault adapters |
| `packages/core/src/engine/` | Composition root for programmatic use |
| `packages/core/src/public/` | Stable public API exports |
| `packages/cli/` | Commander CLI adapter |
| `action/` | GitHub Action adapter and bundled artifact |
| `extension/` | VS Code extension package and extension docs |

## Design Rules

- Domain stays independent from infrastructure and application.
- Infrastructure implements domain contracts.
- Public exports define stable consumer surfaces.
- Test layout should mirror source layout where practical.
- New extension code should keep editor adapters separate from lint
  orchestration and core rule behavior.

## Import Direction

```text
public/engine/cli/action/extension adapters
    -> application
        -> domain
    -> infrastructure implements domain contracts
```

Domain must not import outward. Adapter layers may depend on core public APIs,
but core must not depend on editor or CI adapters.
