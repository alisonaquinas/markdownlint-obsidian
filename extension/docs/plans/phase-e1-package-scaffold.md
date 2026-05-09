---
title: "Phase E1: Package Scaffold And Toolchain"
aliases:
  - "Phase E1: Package Scaffold And Toolchain"
  - "Plans / Phase E1 Package Scaffold"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e1-package-scaffold"
  - "plans"
  - "phase/e1"
type: "plan"
status: "current"
updated: 2026-05-09
up: "[[plans/index]]"
---

# Phase E1: Package Scaffold And Toolchain

## Goal

Create a VS Code extension package that fits this repo's Bun workspace,
TypeScript, lint, test, and packaging standards.

## Scope

- extension package metadata.
- TypeScript configs.
- source and test directory scaffold.
- activation entry point with no lint behavior yet.
- VS Code extension manifest contributions required for later phases.
- local extension-host smoke harness.
- package and docs scripts wired into root verification.
- packaged `markdownlint-obsidian` library dependency for extension runtime
  lint and fix behavior.

## Proposed File Layout

```text
extension/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── src/
│   ├── extension.ts
│   ├── editor/
│   ├── diagnostics/
│   ├── config/
│   ├── fixes/
│   ├── commands/
│   └── shared/
├── tests/
│   ├── unit/
│   ├── component/
│   └── integration/
├── schemas/
├── dist/
└── docs/
```

`extension/docs/` already exists and remains documentation. `extension/src/`
will contain production extension source.

## Manifest Requirements

- declare `extensionDependencies` with `alisonaquinas.flavor-grenade-lsp`;
- activate on `onLanguage:ofmarkdown`;
- activate on command ids needed for setup and troubleshooting;
- declare workspace trust posture;
- declare virtual workspace posture;
- contribute placeholder commands behind implemented handlers;
- contribute configuration keys with documented defaults;
- point `main` at generated build output.

## Build Script Requirements

Match the Flavor Grenade extension package shape unless an ADR records a
different extension toolchain:

- `main` points to `./dist/extension.js`;
- `vscode:prepublish` runs the extension build;
- `compile` runs typecheck and build;
- `check-types` runs `tsc --noEmit`;
- `build:extension` bundles `src/extension.ts` with esbuild for Node and marks
  `vscode` external;
- `@vscode/vsce` is the packaging tool used by release automation.

The Flavor Grenade extension also cross-compiles and bundles a platform server
binary before packaging. This extension should not copy that step while
Flavor Grenade remains an installed extension dependency and
`markdownlint-obsidian` runs as TypeScript/JavaScript in the extension host.

## Runtime Dependency Requirements

- Add `markdownlint-obsidian` as an extension package dependency.
- Do not add `markdownlint-obsidian-cli` as a runtime dependency.
- Do not require users to install the CLI globally or in the workspace.
- Bundle the library runtime into the VSIX or include it through the extension
  package dependency layout.
- Add a clean-machine smoke test where no CLI binary exists on `PATH` and the
  extension still activates, lints, and fixes through the library.

## Implementation Tasks

- [ ] Add `extension` to the root workspace list if the package should be
  managed by Bun workspaces.
- [ ] Create `extension/package.json` with VS Code metadata, scripts, engines,
  dependencies, and extension manifest fields.
- [ ] Declare `markdownlint-obsidian` as the runtime lint engine dependency and
  keep `markdownlint-obsidian-cli` out of runtime dependencies.
- [ ] Add TypeScript configs extending the root strict baseline.
- [ ] Add bundler configuration or build script.
- [ ] Add `vscode:prepublish`, `compile`, `check-types`, and
  `build:extension` scripts aligned with Flavor Grenade's extension package.
- [ ] Add minimal `activate` and `deactivate` exports.
- [ ] Register placeholder output channel and command handlers.
- [ ] Add unit test harness with Bun.
- [ ] Add extension-host smoke test harness.
- [ ] Add `.vscodeignore` or equivalent package exclusion policy.
- [ ] Update root `package.json` scripts so extension typecheck, lint, test,
  and build are reachable from CI.
- [ ] Update [[tests/automation]] with concrete
  extension commands.

## Test Plan

| Test | Evidence |
| :--- | :--- |
| manifest inspection | dependency id, activation events, command ids, settings, capabilities |
| TypeScript project check | strict flags preserved |
| lint check | extension source included in ESLint and Prettier |
| unit smoke | activation helpers can be imported |
| extension-host smoke | extension loads without throwing |
| package inspection | VSIX contains expected generated files only |
| no CLI install smoke | extension loads and can reach library adapter with no CLI on `PATH` |

## Verification

```bash
bun run typecheck
bun run lint
bun --cwd extension test
bun --cwd extension run build
bun --cwd extension run package:check
```

## Acceptance Criteria

- extension package builds from clean source.
- extension package loads in an Extension Development Host.
- root CI runs extension typecheck, lint, tests, and build.
- no extension source imports core internals.
- no extension runtime path requires `markdownlint-obsidian-cli`.
- no lint or type strictness rules are weakened.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| VS Code extension tooling expects npm or Node scripts | keep Bun as repo orchestrator and use Node-compatible commands inside extension scripts where required |
| Extension bundle pulls in too much of core or accidentally includes CLI code | inspect bundle and import only public library APIs |
| Manifest placeholders drift from requirements | add manifest inspection tests in this phase |

## Exit Criteria

E1 exits when a no-op extension can be built, linted, typechecked, tested,
packaged, and loaded locally.
