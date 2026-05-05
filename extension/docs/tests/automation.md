# Test Automation

Automation lives beside the test plans so it can be reviewed before extension
source exists.

## Scripts

| Script | Purpose | Safe Today |
| :--- | :--- | :--- |
| [scripts/check-test-docs.mjs](scripts/check-test-docs.mjs) | verifies the test-plan docs and script catalog are present | yes |
| [scripts/run-verification-gates.mjs](scripts/run-verification-gates.mjs) | runs extension docs lint, root dogfood docs lint, and future extension package gates | yes |
| [scripts/check-validation-contracts.mjs](scripts/check-validation-contracts.mjs) | checks BDD feature readiness, traceability, dependency docs, and future manifest contracts | yes |

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
- Scripts print planned skips for future extension source checks.
- Scripts avoid network access.
- Scripts run from the repository root.
- Scripts must not write files or modify package metadata.
