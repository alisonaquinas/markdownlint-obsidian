# AGENTS.md — Guide for AI Agents Working in `packages/`

Workspace package boundary for the published npm artifacts. This directory
contains the reusable library package and the CLI wrapper package.

## Layout

```text
packages/
├── core/   # markdownlint-obsidian — engine, rules, public API
└── cli/    # markdownlint-obsidian-cli — commander-based wrapper
```

## Workflows

### Choosing the edit target

1. Edit `core/` for linting behavior, rule docs, parser changes, config
   semantics, or public API exports.
2. Edit `cli/` for flags, exit codes, argument parsing, formatter selection,
   or process orchestration.
3. Update the package-local README and changelog when the user-facing surface
   changes.

### Publishing

Publish from the individual package directory:

```bash
cd packages/core && npm publish
cd packages/cli && npm publish
```

Run [`../scripts/prepare-publish.mjs`](../scripts/prepare-publish.mjs) before
publish so `workspace:*` dependencies are rewritten to real semver ranges.

## Invariants — Do Not Violate

- `packages/core` owns all linting behavior. `packages/cli` must stay a thin
  wrapper with no duplicated business logic.
- Never publish from the workspace root. The root `prepublishOnly` guard
  exists to stop that.
- Keep package-local docs aligned with the current package metadata,
  entrypoints, and release process.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [packages/core AGENTS.md](core/AGENTS.md)
- [packages/cli AGENTS.md](cli/AGENTS.md)
