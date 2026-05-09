---
title: "Phase E0: Planning Readiness"
aliases:
  - "Phase E0: Planning Readiness"
  - "Plans / Phase E0 Planning Readiness"
tags:
  - "extension-docs"
  - "extension-docs/plans"
  - "extension-docs/plans/phase-e0-planning-readiness"
  - "plans"
  - "phase/e0"
type: "plan"
status: "current"
updated: 2026-05-09
up: "[[plans/index]]"
---

# Phase E0: Planning Readiness

## Goal

Prepare enough product, architecture, behavior, and test documentation that
extension implementation can proceed without guessing the domain boundary.

## Status

In review. The planning baseline is complete for the current implementation
branch, with release acceptance deferred to PR and CI review.

## Scope

- Extension documentation scaffold.
- Flavor Grenade dependency contract.
- user, functional, architecture, technical, DDD, and BDD documentation.
- unit, verification, and validation test plans.
- dogfood linting for `extension/docs/`.

## Deliverables

| Deliverable | Path | Status |
| :--- | :--- | :--- |
| Extension docs index | [[README]] | complete |
| Architecture overview | [[architecture/overview]] | complete |
| Flavor Grenade contract | [[architecture/flavor-grenade-dependency]] | complete |
| User requirements | [[requirements/user/index]] | complete |
| Functional requirements | [[requirements/functional/index]] | complete |
| Technical requirements | [[requirements/technical/index]] | complete |
| DDD model | [[ddd/README]] | complete |
| BDD model | [[bdd/README]] | complete |
| Test plans | [[tests/README]] | complete |
| Extension docs dogfood config | [../.obsidian-linter.jsonc](../.obsidian-linter.jsonc) | complete |

## Implementation Tasks

- [x] Create extension docs scaffold.
- [x] Document Flavor Grenade LSP technology stack and dependency role.
- [x] Adapt user requirements from vscode-markdownlint research to
  markdownlint-obsidian behavior.
- [x] Add functional requirements linked to user requirements.
- [x] Import architecture requirements and tailor them to npm packages and the
  VS Code extension.
- [x] Add DDD bounded contexts and ubiquitous language.
- [x] Add BDD feature files and traceability.
- [x] Add technical requirements for strict TypeScript and repository tooling.
- [x] Add test plans and runnable planning checks.
- [x] Configure `extension/docs/` dogfood linting in local scripts, CI, and
  pre-commit.
- [x] Record the package location, build tool, dependency boundary, trust
  posture, and packaging decisions.

## Acceptance Criteria

- `bun run test:dogfood:extension-docs` passes.
- `bun extension/docs/tests/scripts/check-test-docs.mjs` passes.
- `bun extension/docs/tests/scripts/check-validation-contracts.mjs` passes.
- roadmap phases have clear entry and exit criteria.
- implementation can start without changing core lint semantics.

## Verification

```bash
bun run test:dogfood:extension-docs
bun extension/docs/tests/scripts/check-test-docs.mjs
bun extension/docs/tests/scripts/check-validation-contracts.mjs
```

## Exit Decision

E1 proceeded with an in-process extension package, bundled library runtime, and
Flavor Grenade as the OFMarkdown document-classification dependency.
