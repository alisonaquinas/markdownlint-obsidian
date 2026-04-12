# Changelog

All notable changes to `markdownlint-obsidian` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-04-11

### Added

- **Phase 8 — CI delivery**
  - JUnit XML formatter (`--output-formatter junit`) for Jenkins, GitLab CI,
    and Azure Pipelines test dashboards.
  - SARIF 2.1.0 formatter (`--output-formatter sarif`) for GitHub code
    scanning, with deduplicated rule metadata.
  - GitHub Action scaffold at `action/` (JavaScript action, Node 20) with
    pre-built bundle at `action/dist/main.js` and a CI drift-check that
    fails PRs editing `action/src/` without rebuilding.
  - `.pre-commit-hooks.yaml` manifest for the `pre-commit` framework.
  - Multi-stage `docker/Dockerfile` publishing to
    `ghcr.io/alisonaquinas/markdownlint-obsidian` on GitHub release.
  - `docs/guides/ci-integration.md` with GitHub Action, pre-commit, and
    Docker recipes.

### Changed

- `package.json` version bumped to `0.8.0`; `files` array, `repository`,
  `homepage`, `bugs`, and `keywords` populated for npm publishing.
- CLI `--version` now reports `0.8.0`.

## [0.7.0]

### Added

- **Phase 7 — Standard markdownlint integration**
  - `MarkdownLintAdapter` with per-file memoization around upstream
    `markdownlint`.
  - `StandardRuleAdapter` registering MD001..MD049 alongside OFM rules.
  - OFM-conflicting standard rules disabled by default (see
    `docs/rules/standard-md/`).
  - Deep-merge of the `rules` block so user overrides no longer drop
    defaults.

## [0.6.0]

### Added

- **Phase 6 — Block references and highlights**
  - `BlockRefIndexBuilder` and a new runtime block-ref index passed to
    rules via the lint context.
  - OFM rules covering block-reference resolution and `==highlight==`
    syntax.

## [0.5.0]

### Added

- **Phase 5 — Embeds and callouts**
  - `![[wikilink]]` embed validation.
  - Callout admonition parsing and rule coverage.

## [0.4.0]

### Added

- **Phase 4 — Wikilinks**
  - Wikilink parser, exact-match resolution strategy, and vault bootstrap
    (`VaultBootstrap`, `NodeFsVaultDetector`, `FileIndexBuilder`).
  - OFM001..OFM007 no-broken-wikilinks family.

## [0.3.0]

### Added

- **Phase 3 — Frontmatter and tags**
  - Frontmatter YAML parsing via `gray-matter`.
  - Tag syntax rules.

## [0.2.0]

### Added

- **Phase 2 — Parser layer**
  - `MarkdownItParser` wrapping `markdown-it` with a stable AST contract.
  - `LintUseCase` application service.

## [0.1.0]

### Added

- **Phase 1 — Scaffolding**
  - Repository layout, tsconfig/eslint/prettier baseline.
  - DDD/BDD directory scaffolding under `src/` and `tests/`.
  - CLI entrypoint at `bin/markdownlint-obsidian.js`.
  - Architecture policy, roadmap, and design spec under `docs/`.

[0.8.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/alisonaquinas/markdownlint-obsidian/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/alisonaquinas/markdownlint-obsidian/releases/tag/v0.1.0
