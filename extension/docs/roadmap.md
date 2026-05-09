---
title: "Extension Implementation Roadmap"
aliases:
  - "Extension Implementation Roadmap"
  - "Roadmap"
tags:
  - "extension-docs"
  - "extension-docs/roadmap"
type: "roadmap"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Extension Implementation Roadmap

Roadmap for building the `markdownlint-obsidian` VS Code extension.

The roadmap assumes the extension remains an editor adapter around
the bundled `markdownlint-obsidian` library, and that Flavor Grenade owns
OFMarkdown document classification through the `ofmarkdown` language id.

> [!TIP] Delivery map
> Phase work is tracked in [[plans/index]] and execution evidence is captured in [[plans/execution-ledger]].

## Phase Summary

| Phase | Plan | Outcome |
| :--- | :--- | :--- |
| E0 | [[plans/phase-e0-planning-readiness]] | docs, ADRs, requirements, and test contracts are ready to drive implementation |
| E1 | [[plans/phase-e1-package-scaffold]] | VS Code extension package builds, typechecks, lints, tests, and packages locally |
| E2 | [[plans/phase-e2-core-adapter-and-config]] | extension can call bundled library APIs with typed settings and config resolution |
| E3 | [[plans/phase-e3-live-diagnostics]] | eligible `ofmarkdown` documents receive current diagnostics |
| E4 | [[plans/phase-e4-fixes-and-rule-help]] | quick fixes, fix-all, fix preview, and rule documentation links work |
| E5 | [[plans/phase-e5-workspace-commands-and-trust]] | command palette workflows, output channel, trust policy, and unsupported mode handling work |
| E6 | [[plans/phase-e6-packaging-and-ci]] | CI runs extension gates and produces a locally smoke-tested VSIX |
| E7 | [[plans/phase-e7-hardening-and-marketplace]] | release metadata, docs, telemetry posture, Flavor Grenade-aligned publishing, and manual validation are ready for Marketplace publication |

## Delivery Principles

- Build one independently verifiable behavior slice per phase.
- Keep lint semantics in the bundled `markdownlint-obsidian` library;
  extension code owns editor integration only.
- Do not require `markdownlint-obsidian-cli` to be globally installed or
  installed in the user's workspace.
- Treat `ofmarkdown` as the live-lint eligibility signal.
- Preserve the repository strict TypeScript, ESLint, Prettier, and dogfood
  docs gates.
- Add failing tests before non-trivial extension behavior.
- Keep extension-host tests focused on VS Code integration, not core rule
  semantics.

## Dependency Flow

```text
E0 planning
  -> E1 package scaffold
    -> E2 core adapter and config
      -> E3 live diagnostics
        -> E4 fixes and rule help
        -> E5 workspace commands and trust
          -> E6 packaging and CI
            -> E7 hardening and marketplace readiness
```

## Milestone Gates

| Gate | Required Before |
| :--- | :--- |
| Requirements, BDD, DDD, and technical docs exist | E1 starts |
| extension package can build and run tests locally | E2 starts |
| typed core adapter exists and has unit tests | E3 starts |
| live diagnostics pass extension-host smoke tests | E4 and E5 start |
| command and trust behavior has integration coverage | E6 starts |
| VSIX package installs and activates locally | E7 starts |
| Flavor Grenade-aligned `ext-v*` workflow, release checklist, and metadata checks pass | Marketplace release |

## Current Status

E0 through E7 have local implementation evidence on
`feature/extension-project-management`. The local gates build, typecheck, lint,
test, package, run the extension-host smoke test, and lint both documentation
trees. Remote CI and Marketplace publication remain the authoritative release
checks.

## See Also

- [[architecture/overview]]
- [[architecture/flavor-grenade-dependency]]
- [[requirements/functional/index]]
- [[requirements/technical/index]]
- [[bdd/README]]
- [[tests/README]]
