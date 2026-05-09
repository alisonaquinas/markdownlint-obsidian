---
title: "Type Safety"
aliases:
  - "Type Safety"
tags:
  - "docs"
  - "docs/architecture"
  - "architecture"
type: "architecture-policy"
status: "current"
updated: 2026-05-09
up: "[[architecture/README]]"
---

# Type Safety

## Policy

Type annotations are enforced contracts. TypeScript should run in strict mode
for production packages and extension code.

## Rules

| Rule | Reason |
| :--- | :--- |
| No implicit `any` | Unknown values must be narrowed explicitly |
| Explicit nullable types | Absence is part of the contract |
| Domain values are readonly where practical | Prevent accidental mutation |
| Public API exports stable types | Consumers rely on semantic versioning |
| Runtime validation at external boundaries | TypeScript cannot validate JSON or filesystem input |

## Boundary Strategy

- Parse JSONC/YAML into `unknown`, then validate before casting.
- Keep `unknown` at plugin and custom-rule boundaries until checked.
- Convert VS Code and CLI inputs into core domain types before use.
- Do not leak infrastructure-specific shapes into the domain.

## Suppressions

Use `@ts-expect-error` only with a reason. Prefer narrowing, type guards, or
small adapter functions over casts. If a cast is required, keep it near the
validated boundary and document why the validation is sufficient.
