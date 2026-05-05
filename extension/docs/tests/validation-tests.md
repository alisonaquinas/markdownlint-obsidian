# Validation Test Plan

Validation tests prove that the extension satisfies user-visible behavior, not
just technical gates.

## Validation Sources

| Source | Purpose |
| :--- | :--- |
| [BDD features](../bdd/README.md) | shared behavior examples for activation, diagnostics, fixes, config, commands, and metadata |
| [User requirements](../requirements/user/index.md) | user-visible needs and acceptance cues |
| [Functional requirements](../requirements/functional/index.md) | measurable editor behavior |
| [DDD language](../ddd/ubiquitous-language.md) | stable terms used in scenarios and output |

## Automated Validation Layers

| Layer | Coverage |
| :--- | :--- |
| BDD syntax and traceability | feature files have scenarios and requirement tags |
| Extension-host smoke tests | activation, diagnostics, code actions, commands, config watchers |
| Fixture workspaces | trusted local vault, untrusted workspace, generic Markdown workspace, unsupported URI |
| Smoke install | packaged VSIX loads, registers commands, reports Flavor Grenade dependency state |
| Metadata validation | manifest, README, schema, rule docs, and changelog agree |

## Validation Scenarios

| Scenario Area | Required Evidence |
| :--- | :--- |
| Activation and eligibility | OFMarkdown document activates feedback; generic Markdown is skipped by default |
| Live diagnostics | current diagnostics match latest eligible text and effective config |
| Fixes and formatting | quick fix, fix all, preview, rule help, and formatting boundary behave as documented |
| Configuration and trust | config schemas, custom rules, trust policy, and unsupported workspaces are visible |
| Workspace commands | workspace lint, open config, temporary disable, and configuration watchers report outcomes |
| Packaging and metadata | dependency, command, schema, and version metadata match documented behavior |

## Manual Validation Checkpoints

Manual checks are allowed only where human inspection catches issues automation
does not judge:

- Problems panel text is understandable.
- Command Palette titles read naturally.
- output-channel errors give enough context.
- rule documentation links land on useful pages.
- missing Flavor Grenade messaging is clear but not noisy.

Manual validation must record the VS Code version, extension build, workspace
fixture, and result.

## Current Automation

```bash
bun extension/docs/tests/scripts/check-validation-contracts.mjs
```

The script validates BDD feature readiness, extension-contract documents, and
`extension/package.json`.
