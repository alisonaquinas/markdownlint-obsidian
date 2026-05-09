---
title: "Test Plan Traceability"
aliases:
  - "Test Plan Traceability"
  - "Tests / Traceability"
tags:
  - "extension-docs"
  - "extension-docs/tests"
  - "extension-docs/tests/traceability"
  - "tests"
type: "test-plan"
status: "current"
updated: 2026-05-09
up: "[[tests/README]]"
---

# Test Plan Traceability

## Plan To Requirement Map

| Test Plan | Requirements | BDD Features |
| :--- | :--- | :--- |
| [[tests/unit-tests]] | `MarkdownlintObsidian.DocumentEligibility`, `MarkdownlintObsidian.LintTrigger`, `MarkdownlintObsidian.Diagnostics`, `MarkdownlintObsidian.QuickFix`, `MarkdownlintObsidian.CustomRuleTrust` | activation and eligibility, live diagnostics, fixes and formatting, configuration and trust |
| [[tests/verification-tests]] | `MarkdownlintObsidianTechnical.TypecheckGate`, `MarkdownlintObsidianTechnical.LintGate`, `MarkdownlintObsidianTechnical.TestGate`, `MarkdownlintObsidianTechnical.DocsGate`, `MarkdownlintObsidianTechnical.ReleaseGate` | packaging and metadata |
| [[tests/validation-tests]] | all user requirements, all functional requirements, selected technical release gates | all extension BDD features |

## Script To Evidence Map

| Script | Evidence Produced |
| :--- | :--- |
| [scripts/check-test-docs.mjs](scripts/check-test-docs.mjs) | required test plan files exist and reference automation |
| [scripts/run-verification-gates.mjs](scripts/run-verification-gates.mjs) | extension docs lint, root dogfood docs lint, extension package gate output |
| [scripts/check-validation-contracts.mjs](scripts/check-validation-contracts.mjs) | BDD feature readiness, traceability coverage, Flavor Grenade dependency doc coverage, manifest checks |

## Exit Criteria

Extension work is ready for review when:

- unit, verification, and validation plans exist;
- scripts run from the repository root;
- BDD feature files have scenarios and requirement tags;
- technical gates are traceable to requirements;
- package checks pass or explicitly skip only in checkouts without the
  extension package.
