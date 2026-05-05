---
title: Linting and Tooling
---

# Linting and Tooling

## Policy

Strict linting, formatting, type checking, and tests run locally and in CI with
the same configuration. Warnings should be treated as failures unless a tool
does not support that mode.

## Toolchain

| Tool | Purpose | Enforcement |
| :--- | :--- | :--- |
| TypeScript | Static type checking | CI and local scripts |
| ESLint | Code linting | CI and local scripts |
| Prettier | Formatting | CI and local scripts |
| Bun test | Unit and integration tests | CI and local scripts |
| Cucumber | BDD smoke tests | CI and local scripts |
| markdownlint-obsidian | Dogfood docs linting | CI and local scripts |
| esbuild | GitHub Action bundle | CI artifact check |

## Suppression Policy

Every suppression must explain why it is necessary:

| Suppression | Required |
| :--- | :--- |
| `eslint-disable` | Rule id plus reason |
| `@ts-expect-error` | Reason and expected upstream or typing gap |
| Coverage ignore | Reason the branch cannot be exercised |

Bare suppressions are not permitted.

## Local Verification

```bash
bun run typecheck
bun run lint
bun run test
bun run test:bdd
bun run test:dogfood
```

For action changes, rebuild inside `action/` and ensure `action/dist/main.mjs`
is committed only from the build output.
