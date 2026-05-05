---
title: Documentation Policy
---

# Documentation Policy

## Policy

Public APIs, exported behavior, architectural decisions, and rule semantics need
documentation close to the audience that uses them.

## What Must Be Documented

| Subject | Location |
| :--- | :--- |
| Rule behavior | `docs/rules/<family>/` |
| Public API | `docs/guides/public-api.md` and exported TypeScript declarations |
| Architecture decisions | `docs/adr/` |
| Extension planning | `extension/docs/` |
| Config and CLI usage | `docs/guides/` and package README files |
| Non-obvious code behavior | TSDoc or concise code comments |

## TypeScript Documentation Rules

- Exported interfaces, functions, and classes should have TSDoc when their
  purpose is not obvious from the name and type.
- Comments must describe intent, invariants, or edge cases, not restate code.
- Examples must compile or be marked as conceptual.
- Docs and signatures change in the same commit.

## Anti-Patterns

- Empty comments to satisfy a tool.
- Stale examples.
- Rule docs that duplicate implementation without explaining user impact.
- Extension docs that copy root rule docs instead of linking them.
