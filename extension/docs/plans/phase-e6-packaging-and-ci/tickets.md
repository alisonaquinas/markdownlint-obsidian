# Phase E6 Tickets

## FEAT-007: Verified VSIX Packaging And CI Release Path

Status: `draft`

Goal: make extension checks, packaging, smoke install, checksum generation, and
Flavor Grenade-style release workflow run in CI.

Linked plan: [Phase E6](../phase-e6-packaging-and-ci.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-023` | task | Add extension jobs to CI | `open` |
| `TASK-024` | task | Add VSIX package inspection | `open` |
| `TASK-025` | task | Add extension-host smoke install | `open` |
| `TASK-026` | task | Add ext-v release workflow | `open` |
| `CHORE-005` | chore | Update automation and pre-commit docs | `open` |

Acceptance criteria:

- [ ] CI fails on extension lint, typecheck, test, build, package, or smoke
  install failures.
- [ ] release test tags produce artifacts without publishing.
- [ ] release tags publish through the protected Marketplace job.
- [ ] VSIX checksums and provenance attestations are generated.

## TASK-023: Add Extension Jobs To CI

Scope: extend repository CI with extension lint, typecheck, unit, component,
integration, build, and docs dogfood gates.

Done when a clean checkout runs all extension gates from CI.

## TASK-024: Add VSIX Package Inspection

Scope: verify the VSIX contains expected build output, docs, manifest metadata,
and excludes source or fixtures that should not ship.

Done when package inspection is automated and fails on unexpected file lists.

## TASK-025: Add Extension-Host Smoke Install

Scope: install the packaged VSIX into an Extension Development Host and verify
activation plus command registration.

Done when the smoke test runs in CI without relying on local machine state.

## TASK-026: Add Ext-V Release Workflow

Scope: add an `ext-v*` workflow matching Flavor Grenade's extension publishing
shape: package, checksums, provenance, gated `vsce publish`, and test-tag
publish skip.

Done when `ext-v*...-test*` can exercise the release path without Marketplace
publication.

## CHORE-005: Update Automation And Pre-Commit Docs

Scope: update extension test automation docs and hook notes for the final E6
commands.

Done when local and CI command lists match.
