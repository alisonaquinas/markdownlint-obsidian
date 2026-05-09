---
title: "Test Automation"
aliases:
  - "Test Automation"
  - "Tests / Automation"
tags:
  - "extension-docs"
  - "extension-docs/tests"
  - "extension-docs/tests/automation"
  - "tests"
type: "test-plan"
status: "current"
updated: 2026-05-09
up: "[[tests/README]]"
---

# Test Automation

Automation lives beside the test plans so implementation gates and validation
contracts stay reviewable with the extension source.

## Scripts

| Script | Purpose | Safe Today |
| :--- | :--- | :--- |
| [scripts/check-test-docs.mjs](scripts/check-test-docs.mjs) | verifies the test-plan docs and script catalog are present | yes |
| [scripts/run-verification-gates.mjs](scripts/run-verification-gates.mjs) | runs extension docs lint, root dogfood docs lint, and extension package gates | yes |
| [scripts/check-validation-contracts.mjs](scripts/check-validation-contracts.mjs) | checks BDD feature readiness, traceability, dependency docs, and manifest contracts | yes |

## Local Command Set

```bash
bun extension/docs/tests/scripts/check-test-docs.mjs
bun extension/docs/tests/scripts/run-verification-gates.mjs
bun extension/docs/tests/scripts/check-validation-contracts.mjs
```

## Extension Package Scripts

`extension/package.json` exposes:

```json
{
  "scripts": {
    "build": "build core public API and bundle extension",
    "build:extension": "bundle extension source only",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . && prettier --check .",
    "test": "bun test tests/unit tests/integration",
    "test:integration": "bun test tests/integration",
    "test:extension-host": "VS Code Extension Development Host smoke test",
    "package:check": "VSIX package inspection command"
  }
}
```

The build uses `esbuild` and `@vscode/vsce`. The Extension Development Host
runner uses `@vscode/test-electron`.

## CI Placement

| CI Job | Commands |
| :--- | :--- |
| docs-plan | test-docs script, extension docs lint |
| verification | verification-gates script, root typecheck, root lint |
| validation | validation-contracts script, BDD smoke, extension-host smoke when available |
| release | package build, package inspection, checksum, provenance, Marketplace publish |

## Script Behavior

- Scripts exit non-zero for missing required planning files.
- Scripts print explicit skips only when a checkout lacks the extension package.
- Scripts avoid network access.
- Scripts run from the repository root.
- Scripts must not write files or modify package metadata.
