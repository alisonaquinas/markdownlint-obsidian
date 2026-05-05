# Extension Functional Requirements

## Scope

These Planguage-style functional requirements define the planned VS Code
extension behavior for `markdownlint-obsidian`.

They adapt the coverage model from
[vscode-markdownlint functional research](../../../../docs/research/vscode-markdownlint/requirments/functional/index.md)
to this extension's architecture:

- Flavor Grenade LSP is an installed VS Code extension dependency.
- `ofmarkdown` is the primary live-lint eligibility signal.
- `markdownlint-obsidian` core remains the rule and fix engine.
- Extension code owns diagnostics, code actions, commands, configuration UI,
  trust policy, and package contributions.

## Inventory

| File | Tags |
| :--- | :--- |
| [editing-linting.md](editing-linting.md) | `MarkdownlintObsidian.ExtensionDependency`, `MarkdownlintObsidian.Activation`, `MarkdownlintObsidian.DocumentEligibility`, `MarkdownlintObsidian.LintTrigger`, `MarkdownlintObsidian.ConfigurationResolution`, `MarkdownlintObsidian.Diagnostics` |
| [fixes-formatting.md](fixes-formatting.md) | `MarkdownlintObsidian.CodeActions`, `MarkdownlintObsidian.QuickFix`, `MarkdownlintObsidian.FixAll`, `MarkdownlintObsidian.FixCheckPreview`, `MarkdownlintObsidian.FormattingBoundary`, `MarkdownlintObsidian.RuleHelp` |
| [workspace-commands.md](workspace-commands.md) | `MarkdownlintObsidian.WorkspaceLint`, `MarkdownlintObsidian.OpenConfigFile`, `MarkdownlintObsidian.ToggleLinting`, `MarkdownlintObsidian.ConfigurationWatchers` |
| [contributions-and-trust.md](contributions-and-trust.md) | `MarkdownlintObsidian.ManifestContributions`, `MarkdownlintObsidian.SchemaValidation`, `MarkdownlintObsidian.WorkspaceTrust`, `MarkdownlintObsidian.CustomRuleTrust`, `MarkdownlintObsidian.FileSystemStrategy` |
| [test-derived.md](test-derived.md) | `MarkdownlintObsidian.ErrorReporting`, `MarkdownlintObsidian.MetadataConsistency` |

## Source Interpretation Notes

- These are proposed requirements, not implementation claims.
- Targets use functional coverage scales because behavior can be tested against
  manifest entries, VS Code extension-host events, and core API outputs.
- Numeric goals are limited to binary or coverage behaviors that can be tested.
- Quality targets such as latency are intentionally omitted until benchmarks or
  stakeholder commitments exist.
