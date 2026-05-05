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

## Implementation Tasks

- [ ] Add extension jobs to `.github/workflows/ci.yml`.
- [ ] Ensure root `bun run typecheck`, `bun run lint`, and `bun run test`
  include or explicitly call extension checks.
- [ ] Add package inspection for VSIX contents.
- [ ] Add Extension Development Host smoke install in CI.
- [ ] Add metadata consistency checks for package version, engine version,
  schema version, README links, changelog links, and rule docs.
- [ ] Update [../tests/automation.md](../tests/automation.md) with final
  commands.
- [ ] Update pre-commit documentation if extension source adds new fast hooks.
- [ ] Decide whether packaged VSIX artifacts should be uploaded from CI.

## Test Plan

| Scenario | Evidence |
| :--- | :--- |
| clean checkout | install, typecheck, lint, test, build all pass |
| extension package | VSIX contains expected files and entry point |
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
```

## Acceptance Criteria

- CI fails if extension typecheck, lint, tests, build, package inspection, or
  smoke install fail.
- extension docs remain covered by dogfood lint in CI and pre-commit.
- package metadata and manifest contribution checks run automatically.
- release candidates can be reproduced from a clean checkout.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Extension-host tests are slow or flaky in CI | keep smoke coverage narrow and leave adapter coverage in faster tests |
| VSIX packaging includes too much source | inspect package file list and keep `.vscodeignore` strict |
| CI duplicates root workspace work | centralize commands in package scripts and call those from workflows |

## Exit Criteria

E6 exits when CI can verify and package the extension from a clean checkout and
the produced VSIX passes a local smoke install.
