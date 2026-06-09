---
title: "Extension Test Plans"
aliases:
  - "Extension Test Plans"
  - "Tests / Index"
tags:
  - "extension-docs"
  - "extension-docs/tests"
  - "tests"
type: "test-index"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Extension Test Plans

Test planning and automation entry points for the `markdownlint-obsidian`
VS Code extension.

This tree describes how extension work is tested and includes scripts that run
against the current documentation, package, and repository contracts.

> [!INFO] Evidence map
> Test evidence links back to [[requirements/index]], [[bdd/README]], and [[plans/execution-ledger]].

## Inventory

| File | Purpose |
| :--- | :--- |
| [[tests/unit-tests]] | Unit and component test plan for extension domain adapters |
| [[tests/verification-tests]] | Technical verification plan for typecheck, lint, build, package, and docs gates |
| [[tests/validation-tests]] | User-facing validation plan for BDD, extension-host, and manual smoke coverage |
| [[tests/automation]] | Script catalog, local commands, CI placement, and package scripts |
| [[tests/traceability]] | Mapping between test plans, requirements, BDD features, and scripts |
| [scripts/](scripts/) | Runnable automation helpers for extension gates |

## Test Taxonomy

| Layer | Intent | Primary Evidence |
| :--- | :--- | :--- |
| Unit | Prove small extension decisions and adapters | Bun tests over pure TypeScript modules |
| Component | Prove extension orchestration without a VS Code host | Bun tests with fake VS Code/core adapters |
| Verification | Prove the build is technically acceptable | typecheck, lint, docs lint, package inspection, import-boundary checks |
| Validation | Prove the extension satisfies user-visible behavior | BDD scenarios, extension-host tests, smoke install, curated manual checks |

## Current Automation

```bash
bun extension/docs/tests/scripts/check-test-docs.mjs
bun extension/docs/tests/scripts/run-verification-gates.mjs
bun extension/docs/tests/scripts/check-validation-contracts.mjs
```

The scripts are package-aware. They check the extension package when present and
fall back to explicit skips only when a checkout lacks that package.
