# ADR006 — Split into library + CLI packages (monorepo)

**Status:** Accepted
**Date:** 2026-04-13
**Context phase:** Phase 13

## Context

`markdownlint-obsidian` is currently a single npm package that bundles both the linting engine and the `markdownlint-obsidian` CLI binary. This creates two problems:

1. **CLI dependency bleed.** Tool authors who want to embed the linting engine programmatically (e.g. in a VS Code extension, a build system plugin, or a pre-commit framework) must also install `commander` and any other CLI-only dependencies. The engine surface they need is buried under presentation concerns.

2. **No stable programmatic API.** There is no top-level `lint()` / `fix()` function that wires the full DI graph. Callers must manually construct `ConfigLoader`, `FileDiscovery`, `LintUseCase`, etc. — reaching into `src/infrastructure/` internals that are not part of the public contract and can change without a semver bump.

The DDD bounded-context design (`docs/ddd/bounded-contexts.md`) already identifies the CLI presentation layer as a separate concern from the Linting, Config, and Vault contexts. A package boundary makes that separation physical and enforceable.

## Decision

Split into two independently publishable packages inside a **Bun workspace monorepo**:

| Package | npm name | Contents |
|---|---|---|
| Library | `markdownlint-obsidian` | Domain, application, infrastructure layers; `./engine` programmatic API; zero CLI deps |
| CLI | `markdownlint-obsidian-cli` | Thin `commander`-based CLI wrapper; depends on library via `workspace:*` |

Both packages live under `packages/` in the same git repository. A new `./engine` subpath export in the library package provides the stable programmatic API (`lint()`, `fix()`, `getFormatter()`, `loadConfig()`, `discoverFiles()`).

## Why monorepo over separate repositories

- Shared test fixtures and integration test helpers — keeping them in sync across two repos is expensive.
- Atomic cross-package changes — when a new engine capability is added, the CLI change lands in the same commit.
- Single CI run — one green badge covers both packages.
- Bun workspaces (`workspace:*` protocol) resolve the CLI's dependency on the library to the local source at dev time and to the real npm version at publish time.

## Why Bun workspaces

Bun is already the project's toolchain (Phase 11). The workspace protocol is stable and `bun run --filter '*'` delegates builds and tests to all packages in one command. No additional tooling (Nx, Turborepo, Lerna) is needed.

## Consequences

- **Two npm packages** — both `markdownlint-obsidian` and `markdownlint-obsidian-cli` must be published on every release. `release-please` with `"plugins": ["node-workspace"]` handles version synchronisation automatically.
- **Two release-please entries** — `packages/core` and `packages/cli` each get their own Release PR and CHANGELOG. They can release independently (a CLI-only bug fix does not force a library version bump).
- **`action/` re-pointed at CLI package** — the GitHub Action wrapper imports from `markdownlint-obsidian-cli` instead of the library. `action/package.json` dependency changes from `"markdownlint-obsidian": "file:.."` to `"markdownlint-obsidian-cli": "workspace:*"`.
- **DIP enforced at package boundary** — no code in `markdownlint-obsidian-cli` may import from `markdownlint-obsidian/src/infrastructure/`. The only coupling is through the `./engine` subpath export.
- **`commander` removed from library deps** — users who `npm install markdownlint-obsidian` no longer pull in CLI-only dependencies.

## Rejected alternatives

**Keep single package, add `./engine` export only.**
This gives a stable programmatic API but does not remove `commander` from the package's `dependencies`. Library users still pay the install cost of CLI tooling. The CLI-free install goal is not achieved.

**Separate git repositories.**
Maximises isolation but loses atomic commits and shared test infrastructure. Cross-package refactors require coordinated PRs. The overhead is not justified at this project's scale.

## Related

- [[plans/phase-13-package-split]]
- [[plans/phase-12-cd-automation]]
- [[ddd/bounded-contexts]]
- [[adr/ADR005-node-path-in-domain]]
