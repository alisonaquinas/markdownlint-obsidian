# Phase E7: Hardening And Marketplace Readiness

## Goal

Prepare the extension for public release by hardening behavior, metadata,
documentation, and validation workflows.

## Scope

- manual validation checklist.
- Marketplace metadata and assets.
- release notes and changelog policy.
- telemetry and privacy posture.
- performance sanity checks.
- accessibility and UX review for commands and output.
- documented limitations for Flavor Grenade dependency, remote workspaces, and
  virtual workspaces.

## Implementation Tasks

- [ ] Add extension README for Marketplace users.
- [ ] Add changelog entries for extension behavior.
- [ ] Add icon, categories, keywords, repository links, and issue links.
- [ ] Document Flavor Grenade dependency installation and troubleshooting.
- [ ] Document supported workspace modes.
- [ ] Run manual validation against fixture workspaces.
- [ ] Run performance sanity checks on representative vault sizes.
- [ ] Review output messages and command titles for clarity.
- [ ] Decide telemetry posture and document it.
- [ ] Verify license, notices, bundled dependencies, and generated assets.
- [ ] Add release checklist for VSIX packaging and publication.

## Manual Validation Matrix

| Fixture | Checks |
| :--- | :--- |
| trusted local vault | activation, diagnostics, quick fix, workspace lint |
| generic Markdown workspace | no automatic live linting by default |
| missing Flavor Grenade | dependency message and command availability |
| untrusted workspace | custom rules blocked, built-in behavior documented |
| config-heavy workspace | schema help, config watcher, output errors |
| unsupported workspace mode | visible rejection message |

## Automated Validation

- BDD feature readiness check.
- extension-host smoke suite.
- package metadata consistency check.
- VSIX package inspection.
- docs dogfood lint.
- pre-commit hook run.

## Verification

```bash
bun run lint
bun run test:dogfood
bun --cwd extension run test:integration
bun --cwd extension run package:check
python -m pre_commit run --all-files
```

## Acceptance Criteria

- Marketplace README explains dependency, scope, commands, settings, fixes,
  trust behavior, and known limitations.
- manual validation matrix has recorded results.
- release package passes local install and activation smoke tests.
- telemetry posture is explicit.
- docs and package metadata agree with the bundled engine behavior.
- maintainers have an explicit go or no-go checklist for publication.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Marketplace users install without Flavor Grenade | make dependency visible in manifest, README, and output channel |
| Large vaults reveal slow live linting | document limits, add cancellation, and defer indexing improvements to a follow-up phase |
| Remote workspace expectations exceed support | publish explicit support table and fail visibly in unsupported modes |

## Exit Criteria

E7 exits when maintainers can publish or intentionally defer Marketplace
release with known limitations documented and validated.
