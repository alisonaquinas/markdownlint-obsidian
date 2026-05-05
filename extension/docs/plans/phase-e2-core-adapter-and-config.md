# Phase E2: Core Adapter And Configuration

## Goal

Create typed extension adapters that call the bundled `markdownlint-obsidian`
library through public APIs and resolve effective extension configuration
without publishing diagnostics yet.

## Scope

- public core API boundary.
- VS Code settings reader.
- config source discovery and schema contribution.
- Flavor Grenade dependency-state adapter.
- document eligibility service.
- file-system and workspace-mode policy skeleton.
- output-channel error formatting.

## Design Targets

- Extension code imports from `markdownlint-obsidian/engine` or other public
  package exports only.
- Extension code does not spawn `markdownlint-obsidian-cli` for runtime lint or
  fix behavior.
- VS Code inputs are narrowed before use.
- config behavior matches core defaults unless extension-only settings are
  documented.
- document eligibility uses `languageId === "ofmarkdown"` for automatic live
  linting.

## Implementation Tasks

- [ ] Define extension-domain types for dependency state, document eligibility,
  run mode, effective extension config, trust policy, and file-system strategy.
- [ ] Implement a VS Code settings reader with runtime validation.
- [ ] Implement a core adapter for `lint`, `fix`, `loadConfig`, and
  `getFormatter`.
- [ ] Add a no-CLI runtime test proving adapter behavior does not depend on a
  global or workspace CLI binary.
- [ ] Implement dependency-state detection for
  `alisonaquinas.flavor-grenade-lsp`.
- [ ] Implement document eligibility for `ofmarkdown`, unsupported URI schemes,
  temporary disable state, and missing dependency state.
- [ ] Add schema contribution for supported linter config filenames.
- [ ] Add output-channel formatting for config, dependency, and adapter errors.
- [ ] Add unit tests for every adapter and decision object.
- [ ] Add component tests using fake VS Code and fake core adapters.

## Test Plan

| Area | Required Cases |
| :--- | :--- |
| settings reader | defaults, invalid value, unknown command argument, run mode |
| dependency state | installed, missing, disabled, inactive |
| eligibility | `ofmarkdown`, generic `markdown`, untitled, virtual, remote-like, disabled |
| config adapter | supported config file names, explicit config, missing config, schema path |
| output formatting | Error, non-Error thrown value, OFM system code, dependency message |
| import boundary | no extension imports from `packages/core/src/` |
| no CLI dependency | no runtime path spawns or resolves `markdownlint-obsidian-cli` |

## Verification

```bash
bun --cwd extension test tests/unit
bun --cwd extension test tests/component
bun run lint
bun run typecheck
```

## Acceptance Criteria

- bundled library calls are hidden behind typed adapter interfaces.
- all external input is narrowed before becoming domain data.
- eligibility decisions are deterministic and test-covered.
- missing Flavor Grenade state is visible in output but does not crash
  activation.
- schema contributions are present and inspectable.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Public library APIs lack an editor-friendly entry point | add public API improvements in a separate core-focused change |
| Config loading needs document text rather than file paths for live lint | isolate the adapter so a later in-memory lint API can replace file-based calls |
| Workspace trust policy blocks too much behavior | test trusted, untrusted, and no-workspace contexts independently |

## Exit Criteria

E2 exits when the extension can decide whether a document should be linted,
resolve effective config, and call bundled library APIs through tested
adapters.
