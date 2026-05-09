---
title: "npm Package Architecture Requirements"
aliases:
  - "npm Package Architecture Requirements"
tags:
  - "docs"
  - "docs/architecture"
  - "architecture"
type: "architecture-policy"
status: "current"
updated: 2026-05-09
up: "[[architecture/README]]"
---

# npm Package Architecture Requirements

Concrete architecture requirements for the published npm packages:

- `markdownlint-obsidian` in `packages/core`;
- `markdownlint-obsidian-cli` in `packages/cli`.

These requirements adapt the root architecture policies to the technical shape
of the package workspace.

## PackageArchitecture.CoreOwnsLinting

```text
Tag: PackageArchitecture.CoreOwnsLinting
Gist: Keep all linting behavior in the core package.
Ambition: The CLI, GitHub Action, and VS Code extension reuse one rule engine instead of duplicating behavior.
Scale: Percentage of linting, parsing, rule, fix, config, vault, and formatter behavior implemented in `packages/core` or exposed through its public engine/API.
Meter: Import-boundary review and tests for changes touching `packages/cli`, `action`, or `extension` code, verifying they call core APIs rather than reimplementing lint behavior.
Fail: Any adapter package implements OFM parsing, rule logic, config merging, vault resolution, or fix application outside core.
Goal: 100% of lint behavior lives in `packages/core` or is delegated to `packages/core`.
Stakeholders: Package consumers, CLI users, extension maintainers.
Owner: markdownlint-obsidian maintainers.
Source: [packages AGENTS](../../packages/AGENTS.md); [core AGENTS](../../packages/core/AGENTS.md).
```

## PackageArchitecture.CLIThinWrapper

```text
Tag: PackageArchitecture.CLIThinWrapper
Gist: Keep the CLI as argument parsing and process orchestration only.
Ambition: CLI behavior stays predictable while core owns business semantics.
Scale: Percentage of `packages/cli/src` production code that is limited to command-line argument parsing, engine invocation, formatter selection, stdin/stdout/stderr behavior, and exit-code handling.
Meter: Source review and integration tests for every CLI behavior change.
Fail: CLI source contains rule logic, parser logic, formatter implementation, config merge logic, or vault resolution logic.
Goal: 100% of CLI production code stays within adapter responsibilities.
Stakeholders: CLI users, package maintainers.
Owner: markdownlint-obsidian CLI maintainers.
Source: [CLI AGENTS](../../packages/cli/AGENTS.md); [CLI args](../../packages/cli/src/args.ts).
```

## PackageArchitecture.ConfigParity

```text
Tag: PackageArchitecture.ConfigParity
Gist: Target markdownlint-cli2 feature parity for configuration loading.
Ambition: Existing markdownlint-cli2 workspaces can move to markdownlint-obsidian without surprising config discovery, parser, pointer, inheritance, or grouping changes.
Scale: Percentage of markdownlint-cli2 configuration-loading behaviors implemented or explicitly documented as intentional divergences.
Meter: Config parity fixtures and integration tests covering discovered `.markdownlint-cli2.*`, discovered `.markdownlint.*`, explicit `--config`, `--configPointer`, JSONC/YAML/TOML/CJS/MJS parsing, nested directory overrides, `extends`, and effective-config grouping.
Fail: The CLI or core silently diverges from markdownlint-cli2 for a covered config behavior, or an intentional OFM difference lacks user-facing documentation.
Goal: 100% parity for supported markdownlint-cli2 configuration workflows, with named OFM-specific divergences.
Stakeholders: CLI users, CI maintainers, VS Code extension maintainers.
Owner: markdownlint-obsidian maintainers.
Source: [Phase 15 config parity plan](../plans/phase-15-cli2-config-parity.md); [markdownlint-cli2 configuration loading analysis](../research/markdownlint-cli2-config-loading-analysis.md).
```

## PackageArchitecture.PublicAPISemver

```text
Tag: PackageArchitecture.PublicAPISemver
Gist: Preserve semver for exported package APIs.
Ambition: Custom rule authors and programmatic consumers can upgrade safely.
Scale: Percentage of changes to `markdownlint-obsidian/api`, `markdownlint-obsidian/rules`, `markdownlint-obsidian/engine`, and CLI flags that are classified as patch, minor, or major according to documented compatibility impact.
Meter: Pull request review comparing changed exports, package `exports`, public docs, README, changelog, and tests.
Fail: A breaking export, type, rule name, or CLI flag change ships without major-version handling and documentation.
Goal: 100% of public-surface changes receive correct semver classification and matching docs.
Stakeholders: Custom rule authors, package consumers, release maintainers.
Owner: markdownlint-obsidian maintainers.
Source: [public API guide](../guides/public-api.md); [core package metadata](../../packages/core/package.json); [CLI package metadata](../../packages/cli/package.json).
```

## PackageArchitecture.BuildOutputs

```text
Tag: PackageArchitecture.BuildOutputs
Gist: Generate npm package build outputs reproducibly.
Ambition: Published package contents match source, metadata, and workspace dependency policy.
Scale: Percentage of package builds that produce expected `dist/` files, package metadata, entry points, shebangs, and dependency rewrites.
Meter: CI build test running `bun run build`, package-local build scripts, package tarball inspection, and dry-run publish checks.
Fail: A package lacks an expected `dist` entry point, ships unresolved `workspace:*`, has a broken CLI shebang, or includes unintended build artifacts.
Goal: 100% of package build outputs match expected package manifests and publish policy.
Stakeholders: npm users, release maintainers.
Owner: markdownlint-obsidian release maintainers.
Source: [core AGENTS](../../packages/core/AGENTS.md); [CLI AGENTS](../../packages/cli/AGENTS.md); [prepare publish script](../../scripts/prepare-publish.mjs).
```

## PackageArchitecture.TrustedPublishing

```text
Tag: PackageArchitecture.TrustedPublishing
Gist: Publish npm packages through trusted publishing only.
Ambition: Package releases have provenance and avoid long-lived registry tokens.
Scale: Percentage of npm release paths that use GitHub Actions OIDC, npm provenance, and prepared semver dependencies without registry tokens.
Meter: Workflow inspection and release dry-run verifying `.github/workflows/npm-publish.yml`, reusable publish workflow behavior, package metadata, and absence of `NODE_AUTH_TOKEN` or manual publish steps.
Fail: Any release path uses a registry token, publishes from the workspace root, bypasses provenance, or skips dependency preparation.
Goal: 100% of npm publish paths use trusted publishing with provenance.
Stakeholders: Package users, release maintainers, supply-chain reviewers.
Owner: markdownlint-obsidian release maintainers.
Source: [root AGENTS](../../AGENTS.md); [packages AGENTS](../../packages/AGENTS.md); [install guide](../guides/install.md).
```

## PackageArchitecture.PackageTests

```text
Tag: PackageArchitecture.PackageTests
Gist: Verify package behavior at the correct boundary.
Ambition: Unit tests cover core behavior, integration tests cover CLI behavior, and dogfood tests cover docs behavior.
Scale: Percentage of package behavior changes covered by the narrowest meaningful test level plus any required integration or dogfood checks.
Meter: Pull request review and CI evidence for `bun test`, package-local integration tests, BDD smoke tests when user workflows change, and `bun run test:dogfood` when docs change.
Fail: A package behavior change lacks tests at the relevant boundary, or docs change without dogfood lint.
Goal: 100% of package behavior changes include relevant test evidence.
Stakeholders: Package maintainers, CLI users, CI users.
Owner: markdownlint-obsidian maintainers.
Source: [Test-Driven Development](test-driven-development.md); [root AGENTS](../../AGENTS.md).
```
