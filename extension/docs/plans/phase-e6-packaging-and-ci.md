---
title: "Phase E6: Packaging And CI"
aliases:
  - "Phase E6: Packaging And CI"
  - "Plans / Phase E6 Packaging And CI"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e6-packaging-and-ci"
  - "plans"
  - "phase/e6"
type: "plan"
status: "current"
updated: 2026-05-09
up: "[[plans/index]]"
---

# Phase E6: Packaging And CI

## Goal

Make the extension build, verify, package, and smoke install through CI with
the same discipline as the existing packages.

## Scope

- root CI integration.
- extension package build.
- VSIX package inspection.
- extension-host smoke install.
- metadata consistency checks.
- docs dogfood checks.
- pre-commit and local verification docs.

## Flavor Grenade Alignment

Flavor Grenade's VS Code extension publishes from an `ext-v*` tag workflow. It
builds target-specific VSIX artifacts, writes SHA-256 checksum files, attests
build provenance for the VSIX files, uploads artifacts, and publishes through a
gated `vsce-publish` environment with `@vscode/vsce`.

This extension should match that release contract:

- release trigger: `ext-v*`;
- build job: package VSIX artifacts before publishing;
- target matrix: use the same VS Code target list if target-specific packages
  are needed;
- provenance: use GitHub build-provenance attestations for generated VSIX
  files;
- checksums: write and verify SHA-256 files before publish;
- publish job: download artifacts, verify checksums, verify the publisher PAT,
  and publish via `vsce publish --packagePath`;
- test tags: allow `ext-v*...-test*` tags to build, package, checksum, and
  attest without publishing because `vsce` does not provide a true dry-run
  publish mode.

Do not copy Flavor Grenade's platform server-binary cross-compilation step
unless a later ADR changes this extension from an in-process JavaScript
adapter to a packaged binary or server runtime.

## CI Gates

| Gate | Command |
| :--- | :--- |
| root typecheck | `bun run typecheck` |
| root lint | `bun run lint` |
| root tests | `bun run test` |
| root BDD smoke | `bun run test:bdd` |
| docs dogfood | `bun run test:dogfood` |
| extension tests | `bun --cwd extension test` |
| extension integration | `bun --cwd extension run test:integration` |
| extension build | `bun --cwd extension run build` |
| extension package check | `bun --cwd extension run package:check` |
| VSIX checksum | `sha256sum *.vsix > checksums-<target>.sha256` |
| provenance attestation | `actions/attest-build-provenance` over generated VSIX files |

## Implementation Tasks

- [ ] Add extension jobs to `.github/workflows/ci.yml`.
- [ ] Ensure root `bun run typecheck`, `bun run lint`, and `bun run test`
  include or explicitly call extension checks.
- [ ] Add package inspection for VSIX contents.
- [ ] Add Extension Development Host smoke install in CI.
- [ ] Add `.github/workflows/extension-release.yml` triggered by `ext-v*`
  tags.
- [ ] Add VSIX target matrix matching Flavor Grenade where target-specific
  packages are needed.
- [ ] Generate and upload SHA-256 checksums for every VSIX artifact.
- [ ] Add build-provenance attestations for generated VSIX artifacts.
- [ ] Add `vsce-publish` environment requirements and `VSCE_PUBLISHER_NAME`
  plus `VSCE_PUBLISHER_PAT` secret usage.
- [ ] Verify Marketplace publisher PAT before non-test publish.
- [ ] Skip Marketplace publish for `ext-v*...-test*` tags after package,
  checksum, and attestation steps complete.
- [ ] Add metadata consistency checks for package version, engine version,
  schema path, README links, changelog links, and rule docs.
- [ ] Update [[tests/automation]] with final
  commands.
- [ ] Update pre-commit documentation if extension source adds new fast hooks.
- [ ] Decide whether packaged VSIX artifacts should be uploaded from CI.

## Test Plan

| Scenario | Evidence |
| :--- | :--- |
| clean checkout | install, typecheck, lint, test, build all pass |
| extension package | VSIX contains expected files and entry point |
| extension release test tag | target VSIXs, checksums, and attestations are produced without publishing |
| extension release tag | target VSIXs are published through the gated Marketplace job |
| smoke install | extension loads and registers commands |
| dependency metadata | Flavor Grenade dependency remains declared |
| docs gates | root docs and extension docs both pass dogfood lint |
| release metadata | package docs match bundled or declared engine version |

## Verification

```bash
bun run test:all
bun run test:dogfood
bun --cwd extension run build
bun --cwd extension run package:check
bun --cwd extension run test:integration
gh workflow run extension-release.yml --ref ext-v0.0.0-test
```

## Acceptance Criteria

- CI fails if extension typecheck, lint, tests, build, package inspection, or
  smoke install fail.
- extension docs remain covered by dogfood lint in CI and pre-commit.
- package metadata and manifest contribution checks run automatically.
- release candidates can be reproduced from a clean checkout.
- extension release workflow matches Flavor Grenade's Marketplace publishing
  pattern: `ext-v*` tags, VSIX artifacts, checksums, provenance attestations,
  gated PAT-backed `vsce` publish, and test-tag publish skip.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Extension-host tests are slow or flaky in CI | keep smoke coverage narrow and leave adapter coverage in faster tests |
| VSIX packaging includes too much source | inspect package file list and keep `.vscodeignore` strict |
| CI duplicates root workspace work | centralize commands in package scripts and call those from workflows |
| Target-specific VSIX matrix adds noise for a JavaScript-only extension | keep the Flavor Grenade workflow shape, but collapse the matrix if package contents are target-independent |
| Marketplace publish PAT expires or is misconfigured | verify PAT before publish and keep publish behind the `vsce-publish` environment |

## Exit Criteria

E6 exits when CI can verify and package the extension from a clean checkout and
the produced VSIX passes a local smoke install.
