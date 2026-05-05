# Extension Execution Ledger

Roadmap execution evidence for the VS Code extension implementation branch.

Remote CI is still authoritative for final `done` state. The rows below record
local execution evidence gathered before PR review.

| Phase | Status | Evidence |
| :--- | :--- | :--- |
| E0 | in review | planning docs and extension docs dogfood pass |
| E1 | in review | extension package builds, typechecks, lints, tests, and packages |
| E2 | in review | bundled library adapter uses public in-memory editor API; no CLI dependency |
| E3 | in review | OFMarkdown eligibility and diagnostic projection have unit coverage |
| E4 | in review | fix edit translation, fix-all command, preview command, and rule help are implemented |
| E5 | in review | workspace lint, open config, session disable, and trust-gated custom rules are implemented |
| E6 | in review | CI package check and `ext-v*` release workflow are authored |
| E7 | in review | Marketplace README, changelog, license, privacy posture, and package validation are authored |

## Local Gates

```bash
bun run typecheck
bun run lint
bun run test
bun run --filter '*' build
bun run --cwd extension package:check
bun run --cwd extension package
bun run --cwd extension test:extension-host
bun run test:dogfood
bun extension/docs/tests/scripts/run-verification-gates.mjs
bun extension/docs/tests/scripts/check-validation-contracts.mjs
```

## Notes

- `bun run lint` currently exits zero with warning-level size
  notices for `extension/src/extension.ts`.
- `bun run --filter '*' build` also emits pre-existing action bundle warnings
  around CJS bundling of modules using `import.meta.url`.
- Marketplace publish itself is not run locally; it is gated by the
  `vsce-publish` GitHub environment and `ext-v*` tags.
