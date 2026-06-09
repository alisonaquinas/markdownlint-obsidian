---
title: "Extension Plans"
aliases:
  - "Extension Plans"
  - "Plans / Index"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "plans"
type: "plan-index"
status: "current"
updated: 2026-05-09
up: "[[roadmap]]"
---

# Extension Plans

Delivery plans for the VS Code extension.

## Planning Rules

- Keep plans extension-specific.
- Use [[plans/phase-execution]] for phase gate, ticket lifecycle,
  and retrospective rules.
- Record execution evidence in [[plans/execution-ledger]].
- Use [[plans/templates/tickets/index]] when adding new feature,
  task, bug, chore, or spike tickets.
- Keep phase plans small enough to verify independently.
- Record completed work in execution notes instead of rewriting old plans.
- Link plans to requirements and architecture docs.

> [!NOTE] Execution spine
> Read [[roadmap]], then [[plans/index]], then the phase plan and its tickets before changing implementation.

## Phase Outline

| Phase | Plan | Backlog | Goal |
| :--- | :--- | :--- | :--- |
| E0 | [[plans/phase-e0-planning-readiness]] | [[plans/phase-e0-planning-readiness/tickets]] | finish planning docs and implementation-entry checks |
| E1 | [[plans/phase-e1-package-scaffold]] | [[plans/phase-e1-package-scaffold/tickets]] | create a buildable, testable VS Code extension package |
| E2 | [[plans/phase-e2-core-adapter-and-config]] | [[plans/phase-e2-core-adapter-and-config/tickets]] | connect typed extension adapters to bundled library APIs |
| E3 | [[plans/phase-e3-live-diagnostics]] | [[plans/phase-e3-live-diagnostics/tickets]] | publish current diagnostics for eligible `ofmarkdown` documents |
| E4 | [[plans/phase-e4-fixes-and-rule-help]] | [[plans/phase-e4-fixes-and-rule-help/tickets]] | expose quick fixes, fix-all, preview, and docs links |
| E5 | [[plans/phase-e5-workspace-commands-and-trust]] | [[plans/phase-e5-workspace-commands-and-trust/tickets]] | add command workflows, config watchers, output, and trust policy |
| E6 | [[plans/phase-e6-packaging-and-ci]] | [[plans/phase-e6-packaging-and-ci/tickets]] | verify, package, and smoke install the extension in CI |
| E7 | [[plans/phase-e7-hardening-and-marketplace]] | [[plans/phase-e7-hardening-and-marketplace/tickets]] | prepare release metadata, validation, and publication posture |

## Current Status

E0 through E7 have local implementation evidence on
`feature/extension-project-management`. See
[[plans/execution-ledger]] for commands run, outcomes, and review
state. Remote CI and Marketplace publication remain the authoritative release
checks.

## See Also

- [[roadmap]]
- [[requirements/functional/index]]
- [[requirements/technical/index]]
- [[tests/README]]
