# Unit And Component Test Plan

Unit and component tests cover extension-owned decisions without needing a full
VS Code Extension Development Host.

## Scope

- Document eligibility decisions.
- Flavor Grenade dependency-state interpretation.
- run-mode and temporary-disable state transitions.
- configuration and trust policy adapters.
- diagnostic projection from core `LintError` values.
- quick-fix and fix-all edit translation.
- rule-help and metadata mapping.
- output-channel error formatting.

## Current Test Layout

```text
extension/
├── src/
│   ├── editor/
│   ├── diagnostics/
│   ├── config/
│   ├── fixes/
│   ├── commands/
│   └── shared/
└── tests/
    ├── unit/
    │   ├── editor/
    │   ├── diagnostics/
    │   ├── config/
    │   ├── fixes/
    │   └── commands/
    └── component/
        ├── lint-feedback/
        ├── workspace-commands/
        └── package-metadata/
```

## Unit Test Groups

| Group | Examples | Requirement Trace |
| :--- | :--- | :--- |
| Editor eligibility | `ofmarkdown` eligible, generic `markdown` skipped, unsupported URI rejected | `MarkdownlintObsidian.DocumentEligibility` |
| Dependency state | installed, missing, disabled, inactive Flavor Grenade states | `MarkdownlintObsidian.ExtensionDependency` |
| Run mode | on-type triggers, on-save suppression, close clears diagnostics | `MarkdownlintObsidian.LintTrigger` |
| Diagnostic projection | range conversion, severity, source, code, message, stale-result guard | `MarkdownlintObsidian.Diagnostics` |
| Config adapter | config filenames, VS Code setting conversion, schema file selection | `MarkdownlintObsidian.ConfigurationResolution` |
| Trust policy | custom rule allowed, blocked, or reported by workspace mode | `MarkdownlintObsidian.CustomRuleTrust` |
| Fix adapter | single fix, fix all, conflict output, stale edit rejection | `MarkdownlintObsidian.QuickFix`, `MarkdownlintObsidian.FixAll` |
| Command reporting | workspace lint output, open config result, actionable errors | `MarkdownlintObsidian.WorkspaceLint`, `MarkdownlintObsidian.ErrorReporting` |

## Component Test Groups

| Group | Fixture Strategy | Acceptance Signal |
| :--- | :--- | :--- |
| Live lint coordinator | fake VS Code document plus fake core lint API | latest eligible document produces diagnostics |
| Fix workflow | fake diagnostics plus fake workspace edit adapter | edits match core fix payloads |
| Workspace commands | temporary workspace fixture and fake output channel | result or actionable error is always reported |
| Metadata mapping | manifest fixture plus rule-doc fixture | command ids, rule links, and dependency ids match docs |

## Test Data Rules

- Prefer tiny Markdown snippets over copied vault fixtures.
- Use root core fixtures only when the extension contract depends on existing
  core behavior.
- Keep VS Code SDK objects behind test builders so pure tests remain fast.
- Add extension-host tests only when the observable behavior requires VS Code.

## Current Commands

```bash
bun --cwd extension test
bun --cwd extension test:integration
bun --cwd extension test:extension-host
```

## Current Automation

```bash
bun extension/docs/tests/scripts/check-test-docs.mjs
```
