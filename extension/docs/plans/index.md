# Extension Plans

Delivery plans for the VS Code extension.

## Planning Rules

- Keep plans extension-specific.
- Use [phase execution](phase-execution.md) for phase gate, ticket lifecycle,
  and retrospective rules.
- Record execution evidence in [execution ledger](execution-ledger.md).
- Use [ticket templates](templates/tickets/index.md) when adding new feature,
  task, bug, chore, or spike tickets.
- Keep phase plans small enough to verify independently.
- Record completed work in execution notes instead of rewriting old plans.
- Link plans to requirements and architecture docs.

## Phase Outline

| Phase | Plan | Backlog | Goal |
| :--- | :--- | :--- | :--- |
| E0 | [Planning readiness](phase-e0-planning-readiness.md) | [tickets](phase-e0-planning-readiness/tickets.md) | finish planning docs and implementation-entry checks |
| E1 | [Package scaffold and toolchain](phase-e1-package-scaffold.md) | [tickets](phase-e1-package-scaffold/tickets.md) | create a buildable, testable VS Code extension package |
| E2 | [Core adapter and configuration](phase-e2-core-adapter-and-config.md) | [tickets](phase-e2-core-adapter-and-config/tickets.md) | connect typed extension adapters to bundled library APIs |
| E3 | [Live diagnostics](phase-e3-live-diagnostics.md) | [tickets](phase-e3-live-diagnostics/tickets.md) | publish current diagnostics for eligible `ofmarkdown` documents |
| E4 | [Fixes and rule help](phase-e4-fixes-and-rule-help.md) | [tickets](phase-e4-fixes-and-rule-help/tickets.md) | expose quick fixes, fix-all, preview, and docs links |
| E5 | [Workspace commands and trust](phase-e5-workspace-commands-and-trust.md) | [tickets](phase-e5-workspace-commands-and-trust/tickets.md) | add command workflows, config watchers, output, and trust policy |
| E6 | [Packaging and CI](phase-e6-packaging-and-ci.md) | [tickets](phase-e6-packaging-and-ci/tickets.md) | verify, package, and smoke install the extension in CI |
| E7 | [Hardening and marketplace readiness](phase-e7-hardening-and-marketplace.md) | [tickets](phase-e7-hardening-and-marketplace/tickets.md) | prepare release metadata, validation, and publication posture |

## Current Status

E0 through E7 have local implementation evidence on
`feature/extension-project-management`. See
[execution ledger](execution-ledger.md) for commands run, outcomes, and review
state. Remote CI and Marketplace publication remain the authoritative release
checks.

## See Also

- [Roadmap](../roadmap.md)
- [Functional requirements](../requirements/functional/index.md)
- [Technical requirements](../requirements/technical/index.md)
- [Test plans](../tests/README.md)
