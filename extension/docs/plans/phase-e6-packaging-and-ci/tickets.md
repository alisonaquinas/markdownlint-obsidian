---
title: "Phase E6 Tickets"
aliases:
  - "Phase E6 Tickets"
  - "Plans / Phase E6 Packaging And CI / Tickets"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e6-packaging-and-ci"
  - "plans"
  - "phase/e6"
type: "ticket-list"
status: "current"
updated: 2026-05-09
up: "[[plans/phase-e6-packaging-and-ci]]"
---

# Phase E6 Tickets

## FEAT-007: Verified VSIX Packaging And CI Release Path

Status: `in-review`

Goal: make extension checks, packaging, smoke install, checksum generation, and
Flavor Grenade-style release workflow run in CI.

Linked plan: [[plans/phase-e6-packaging-and-ci]]

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-023` | task | Add extension jobs to CI | `in-review` |
| `TASK-024` | task | Add VSIX package inspection | `in-review` |
| `TASK-025` | task | Add extension-host smoke install | `in-review` |
| `TASK-026` | task | Add ext-v release workflow | `in-review` |
| `CHORE-005` | chore | Update automation and pre-commit docs | `in-review` |

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
