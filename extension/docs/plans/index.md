# Extension Plans

Delivery plans for the VS Code extension.

## Planning Rules

- Keep plans extension-specific.
- Keep phase plans small enough to verify independently.
- Record completed work in execution notes instead of rewriting old plans.
- Link plans to requirements and architecture docs.

## Phase Outline

| Phase | Plan | Goal |
| :--- | :--- | :--- |
| E0 | [Planning readiness](phase-e0-planning-readiness.md) | finish planning docs and implementation-entry checks |
| E1 | [Package scaffold and toolchain](phase-e1-package-scaffold.md) | create a buildable, testable VS Code extension package |
| E2 | [Core adapter and configuration](phase-e2-core-adapter-and-config.md) | connect typed extension adapters to public core APIs |
| E3 | [Live diagnostics](phase-e3-live-diagnostics.md) | publish current diagnostics for eligible `ofmarkdown` documents |
| E4 | [Fixes and rule help](phase-e4-fixes-and-rule-help.md) | expose quick fixes, fix-all, preview, and docs links |
| E5 | [Workspace commands and trust](phase-e5-workspace-commands-and-trust.md) | add command workflows, config watchers, output, and trust policy |
| E6 | [Packaging and CI](phase-e6-packaging-and-ci.md) | verify, package, and smoke install the extension in CI |
| E7 | [Hardening and marketplace readiness](phase-e7-hardening-and-marketplace.md) | prepare release metadata, validation, and publication posture |

## Current Status

E0 is mostly complete. E1 is the first source-implementation phase.

## See Also

- [Roadmap](../roadmap.md)
- [Functional requirements](../requirements/functional/index.md)
- [Technical requirements](../requirements/technical/index.md)
- [Test plans](../tests/README.md)
