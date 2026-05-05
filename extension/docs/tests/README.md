# Extension Test Plans

Test planning and automation entry points for the planned
`markdownlint-obsidian` VS Code extension.

This tree describes how extension work should be tested once source exists, and
it includes scripts that can run now against the current documentation and
repository contracts.

## Inventory

| File | Purpose |
| :--- | :--- |
| [unit-tests.md](unit-tests.md) | Unit and component test plan for extension domain adapters |
| [verification-tests.md](verification-tests.md) | Technical verification plan for typecheck, lint, build, package, and docs gates |
| [validation-tests.md](validation-tests.md) | User-facing validation plan for BDD, extension-host, and manual smoke coverage |
| [automation.md](automation.md) | Script catalog, local commands, CI placement, and planned package scripts |
| [traceability.md](traceability.md) | Mapping between test plans, requirements, BDD features, and scripts |
| [scripts/](scripts/) | Runnable automation helpers for current and future extension gates |

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

The scripts are intentionally source-aware. If future extension source or
manifest files are present, they check them. If not, they verify the planning
contracts and print planned skips.
