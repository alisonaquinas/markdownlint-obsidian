---
title: npm Package Architecture Audit - 2026-05-05
---

# npm Package Architecture Audit - 2026-05-05

> [!NOTE]
> Superseded action-bundle details: this audit captured the pre-remediation
> state where the action used `action/dist/main.js`. Current `develop` uses
> `action/dist/main.mjs`, `runs.using: node24`, and CI smoke-tests the rebuilt
> bundle with `node dist/main.mjs`. The findings remain useful historical
> evidence for why the action boundary was changed.

## Scope

Audited current package state against `docs/architecture/`, with emphasis on
`docs/architecture/npm-packages.md`.

Primary published npm packages:

- `packages/core` - `markdownlint-obsidian`
- `packages/cli` - `markdownlint-obsidian-cli`

Related distribution adapter:

- `action` - GitHub Action wrapper around the CLI

## Executive Summary

Core and CLI are broadly aligned with the architecture specs. Typecheck,
build, tests, and dry-run tarball generation all pass for both published npm
packages.

The highest-risk gap is the GitHub Action distribution path. The action is
currently bundled from workspace-linked ESM package output into a CommonJS
bundle. That build emits `import.meta` warnings and the committed bundle fails
at startup. The same area also violates the action package boundary by treating
`action/` as a workspace package and depending on `markdownlint-obsidian-cli`
via `workspace:*` despite the action spec requiring the published CLI package.

## Verification Performed

| Check | Result | Notes |
| --- | --- | --- |
| `bun install --frozen-lockfile` | Pass | Workspace install succeeds. |
| `bun run build` | Pass with warnings | Core and CLI build. Action build emits `import.meta` warnings. |
| `bun run typecheck` | Pass | Core and CLI typecheck. |
| `bun run test` | Pass | Core: 569 pass. CLI: 58 pass. |
| `npm pack --dry-run --json .\packages\core` | Pass | Tarball generated in dry-run metadata. |
| `npm pack --dry-run --json .\packages\cli` | Pass | Tarball generated in dry-run metadata. |
| `node action\dist\main.js` | Fail | Startup crash: `ERR_INVALID_ARG_VALUE` from `createRequire(undefined)`. |

## Findings

### P0 - GitHub Action Bundle Crashes at Startup

Spec references:

- `PackageArchitecture.BuildOutputs`
- `PackageArchitecture.CLIThinWrapper`
- `action/AGENTS.md`
- `action/src/AGENTS.md`

Evidence:

- `bun run build` emits esbuild warnings that `import.meta` is unavailable in
  CommonJS output for bundled CLI/core files:
  `packages/cli/dist/src/args.js` and
  `packages/core/dist/src/infrastructure/formatters/SarifFormatter.js`.
- `node action\dist\main.js` exits 1 with:
  `TypeError [ERR_INVALID_ARG_VALUE]: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`.

Impact:

- The action distribution path is currently unusable.
- CI only verifies that esbuild completes. It does not run the produced action
  bundle, so this failure can ship.

Likely cause:

- `action/package.json` depends on `markdownlint-obsidian-cli` via
  `workspace:*`, so esbuild bundles local CLI/core ESM output.
- The action build targets `--format=cjs`; bundled `createRequire(import.meta.url)`
  sites lose `import.meta.url`.

Recommended fix:

- Make the action invoke or bundle a shape that is valid under `runs.using:
  node20`.
- Add a CI smoke test that executes the action bundle or a minimal
  action harness after building.
- Treat esbuild warnings as failures for `action/`.

### P1 - Action Package Boundary Contradicts Its Own Spec

Spec references:

- `PackageArchitecture.CoreOwnsLinting`
- `PackageArchitecture.CLIThinWrapper`
- `Low Coupling`
- `action/AGENTS.md`

Evidence:

- Root `package.json` includes `"action"` in `workspaces`.
- `action/package.json` has `"markdownlint-obsidian-cli": "workspace:*"`.
- `action/AGENTS.md` says the action is standalone and "must not depend on
  `packages/core` or `packages/cli` source directly" and should depend on the
  published npm release of `markdownlint-obsidian-cli`.
- `action/package-lock.json` appears stale relative to `action/package.json`:
  it records `markdownlint-obsidian` as `file:..` dev dependency and root
  version `1.0.0`, while package manifests are at `1.1.0`.

Impact:

- The action is coupled to workspace build output and local package internals.
- The bundle failure above is a direct consequence of this boundary drift.
- Release/debug behavior may differ from consumer behavior.

Recommended fix:

- Decide one package model for `action/`:
  - standalone action using published CLI dependency, outside root workspaces; or
  - workspace action intentionally bundling local packages, with docs updated and
    CJS/ESM runtime fixed.
- Regenerate `action/package-lock.json` from the chosen model.

### P1 - Action Public Contract Is Documented but Not Implemented

Spec references:

- `PackageArchitecture.PublicAPISemver`
- `Documentation Policy`
- `action/src/AGENTS.md`

Evidence:

- `action/README.md` documents outputs: `error-count`, `warning-count`, and
  `sarif-path`.
- `action/action.yml` declares no `outputs`.
- `action/src/main.ts` never calls `core.setOutput`.
- `fail-on-warnings` is documented as behavior, but `action/src/main.ts`
  treats it as a placeholder and discards it.

Impact:

- GitHub Action users cannot rely on documented outputs.
- `fail-on-warnings` is a public input with misleading semantics.

Recommended fix:

- Either implement the outputs and warning behavior or remove them from docs and
  manifest until supported.
- Add an action-level integration test for documented inputs and outputs.

### P2 - Published Tarballs Include Internal Agent Files and Omit Package License Files

Spec references:

- `PackageArchitecture.BuildOutputs`
- `Documentation Policy`

Evidence:

- `npm pack --dry-run` for `packages/core` reports 589 entries, including
  `src/AGENTS.md`, `src/CLAUDE.md`, and layer-local agent docs.
- `npm pack --dry-run` for `packages/cli` includes `src/AGENTS.md` and
  `src/CLAUDE.md`.
- Both package manifests list `"LICENSE"` under `files`, but there is no
  `packages/core/LICENSE` or `packages/cli/LICENSE`; dry-run tarballs did not
  show a package-local license file.

Impact:

- Published packages include repo-internal AI/operator guidance that consumers
  do not need.
- License metadata exists in `package.json`, but package tarballs do not carry a
  license file next to the package README.

Recommended fix:

- Narrow `files` to published runtime, declarations, examples, README,
  changelog, and license.
- Add package-local `LICENSE` files or adjust package assembly to include root
  `LICENSE`.

### P2 - Domain Layer Has Node Runtime Imports

Spec references:

- `Namespace and Module Structure`
- `Low Coupling`
- `SOLID Principles`
- `packages/core/src/domain/AGENTS.md`

Evidence:

- `packages/core/src/domain/vault/VaultPath.ts` imports `node:path`.
- `packages/core/src/domain/vault/VaultRoot.ts` imports `node:path`.
- `packages/core/src/domain/AGENTS.md` says the domain layer has "zero runtime
  dependencies on Node.js or any infrastructure library."

Impact:

- Current use is not filesystem I/O, so immediate risk is moderate.
- It still weakens the documented domain portability boundary and can complicate
  future editor or browser-like adapter targets.

Recommended fix:

- Move platform path normalization into infrastructure/application boundary code
  and keep domain values POSIX/string based; or
- Update the architecture spec to explicitly allow `node:path` in domain value
  factories if Node-only domain is intentional.

### P2 - Core Package Lacks Post-Publish Verification

Spec references:

- `PackageArchitecture.TrustedPublishing`
- `PackageArchitecture.BuildOutputs`

Evidence:

- `.github/workflows/_publish-packages.yml` publishes both core and CLI with
  `npm publish --provenance`.
- `.github/workflows/release-verify.yml` verifies only CLI release tags:
  `markdownlint-obsidian-cliv*`.
- No equivalent post-publish install, import, or `npm audit signatures` check
  exists for `markdownlint-obsidianv*` core releases.

Impact:

- The core package can publish with provenance but still lack post-publish
  consumer verification.
- Broken core export maps or missing files may be caught later by CLI consumers,
  not immediately after a core-only release.

Recommended fix:

- Add core release verification:
  install `markdownlint-obsidian@<version>`, import `/api`, `/rules`, and
  `/engine`, then run `npm audit signatures`.

### P3 - Publishing Docs Disagree About What `prepare-publish.mjs` Mutates

Spec references:

- `PackageArchitecture.BuildOutputs`
- `Documentation Policy`

Evidence:

- `scripts/prepare-publish.mjs` rewrites the selected package's source
  `package.json`.
- `scripts/README.md` says it rewrites `dist/package.json`.
- `packages/core/AGENTS.md` says `gen-dist-pkg.mjs` rewrites
  `package.json` inside `dist/` to resolve `workspace:*` dependencies; the
  script actually writes a minimal version/type stub.

Impact:

- Maintainers can run or review release steps with the wrong mental model.
- This is documentation drift, not observed runtime breakage.

Recommended fix:

- Update docs to say `prepare-publish.mjs` mutates package-root
  `package.json` in the CI checkout before `npm publish`.
- Clarify that `gen-dist-pkg.mjs` only creates a runtime version stub.

## Requirement-by-Requirement Assessment

| Requirement | Status | Assessment |
| --- | --- | --- |
| `PackageArchitecture.CoreOwnsLinting` | Mostly pass | Core owns parser, rules, config, vault, fix, and formatters. Action boundary drift creates indirect coupling. |
| `PackageArchitecture.CLIThinWrapper` | Pass | CLI source is argument parsing, engine invocation, output, and exit-code orchestration. No rule/parser logic found. |
| `PackageArchitecture.PublicAPISemver` | Mostly pass | Core export subpaths and public API docs align. Action documented inputs/outputs drift from implementation. |
| `PackageArchitecture.BuildOutputs` | Partial fail | Core/CLI build and pack dry-run pass. Action bundle builds with warnings and crashes at startup. Tarballs include internal agent docs and omit package-local license files. |
| `PackageArchitecture.TrustedPublishing` | Mostly pass | Publish workflow uses OIDC and `--provenance`, no `NODE_AUTH_TOKEN` found. Core release lacks post-publish verification. |
| `PackageArchitecture.PackageTests` | Pass for core/CLI | Core unit/integration and CLI integration suites pass. Missing action runtime/output smoke coverage. |

## Positive Findings

- Core and CLI package scripts are present and work locally.
- Core exposes intended public subpaths: `.`, `/api`, `/rules`, `/engine`.
- CLI published bin points at generated `dist/bin.mjs` with Node shebang.
- Release publish workflow uses trusted publishing with provenance and rewrites
  workspace dependencies before publish.
- No registry token usage was found in package publish workflows.
- Rule, parser, formatter, config, vault, public API, and CLI integration tests
  are extensive and passing.

## Suggested Remediation Order

1. Fix action bundling/runtime and add a bundle smoke test.
2. Resolve the action package model: standalone published dependency or
   intentional workspace bundle.
3. Align action docs, `action.yml`, and `main.ts` for outputs and
   `fail-on-warnings`.
4. Clean npm package `files` and include package license files.
5. Add post-publish verification for core releases.
6. Resolve domain `node:path` policy mismatch by code movement or policy update.
7. Correct publishing docs around `prepare-publish.mjs` and dist package stubs.
