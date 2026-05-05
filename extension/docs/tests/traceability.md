# Test Plan Traceability

## Plan To Requirement Map

| Test Plan | Requirements | BDD Features |
| :--- | :--- | :--- |
| [unit-tests.md](unit-tests.md) | `MarkdownlintObsidian.DocumentEligibility`, `MarkdownlintObsidian.LintTrigger`, `MarkdownlintObsidian.Diagnostics`, `MarkdownlintObsidian.QuickFix`, `MarkdownlintObsidian.CustomRuleTrust` | activation and eligibility, live diagnostics, fixes and formatting, configuration and trust |
| [verification-tests.md](verification-tests.md) | `MarkdownlintObsidianTechnical.TypecheckGate`, `MarkdownlintObsidianTechnical.LintGate`, `MarkdownlintObsidianTechnical.TestGate`, `MarkdownlintObsidianTechnical.DocsGate`, `MarkdownlintObsidianTechnical.ReleaseGate` | packaging and metadata |
| [validation-tests.md](validation-tests.md) | all user requirements, all functional requirements, selected technical release gates | all extension BDD features |

## Script To Evidence Map

| Script | Evidence Produced |
| :--- | :--- |
| [scripts/check-test-docs.mjs](scripts/check-test-docs.mjs) | required test plan files exist and reference automation |
| [scripts/run-verification-gates.mjs](scripts/run-verification-gates.mjs) | extension docs lint, root dogfood docs lint, optional extension package gate output |
| [scripts/check-validation-contracts.mjs](scripts/check-validation-contracts.mjs) | BDD feature readiness, traceability coverage, Flavor Grenade dependency doc coverage, optional manifest checks |

## Exit Criteria

Extension work is ready for implementation planning when:

- unit, verification, and validation plans exist;
- scripts run from the repository root;
- BDD feature files have scenarios and requirement tags;
- technical gates are traceable to requirements;
- future package checks have clear planned-skip behavior.
