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

Do not publish packages manually. Release publishing is handled by the
repository workflow in `.github/workflows/npm-publish.yml`, which calls the
reusable `_publish-packages.yml` workflow. Package deployment is tag-driven:
push `markdownlint-obsidianvX.Y.Z` for the core package or
`markdownlint-obsidian-clivX.Y.Z` for the CLI package.

The release workflow must use npm trusted publishing only: GitHub Actions OIDC
with registry-generated provenance. Do not add registry tokens,
`NODE_AUTH_TOKEN`, GitHub Packages npm publishing, GHCR package/image
publishing, or manual package-root `npm publish` release steps.

[`../scripts/prepare-publish.mjs`](../scripts/prepare-publish.mjs) is used by
the release workflow and dry-run checks so `workspace:*` dependencies are
rewritten to real semver ranges before packaging.

## Invariants — Do Not Violate

- `packages/core` owns all linting behavior. `packages/cli` must stay a thin
  wrapper with no duplicated business logic.
- Never publish from the workspace root. The root `prepublishOnly` guard
  exists to stop that.
- Keep publishing tokenless: OIDC trusted publishing only, never registry auth
  tokens.
- Keep package-local docs aligned with the current package metadata,
  entrypoints, and release process.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [packages/core AGENTS.md](core/AGENTS.md)
- [packages/cli AGENTS.md](cli/AGENTS.md)
