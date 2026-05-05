# Extension User Requirements

## Scope

These requirements adapt the
[vscode-markdownlint user research](../../../../docs/research/vscode-markdownlint/requirments/user/index.md)
to `markdownlint-obsidian` capabilities.

They describe user-visible needs for the planned VS Code extension. They are a
baseline for later functional requirements, architecture decisions, and tests.

## Inventory

| File | Requirements |
| :--- | :--- |
| [editing-feedback.md](editing-feedback.md) | `UserMarkdownlintObsidian.FlavorGrenadeDependency`, `UserMarkdownlintObsidian.AutomaticActivation`, `UserMarkdownlintObsidian.OFMRelevantDocuments`, `UserMarkdownlintObsidian.CurrentDiagnostics`, `UserMarkdownlintObsidian.RunModeControl`, `UserMarkdownlintObsidian.VaultAwareFeedback` |
| [fixes-formatting.md](fixes-formatting.md) | `UserMarkdownlintObsidian.QuickFix`, `UserMarkdownlintObsidian.FixAllDocument`, `UserMarkdownlintObsidian.FixCheckPreview`, `UserMarkdownlintObsidian.RuleHelp`, `UserMarkdownlintObsidian.NoUnsafeFormatting` |
| [configuration.md](configuration.md) | `UserMarkdownlintObsidian.ConfigSources`, `UserMarkdownlintObsidian.ConfigDiscovery`, `UserMarkdownlintObsidian.SchemaAssistance`, `UserMarkdownlintObsidian.CustomRules`, `UserMarkdownlintObsidian.RuleFamilyVisibility` |
| [workspace-and-trust.md](workspace-and-trust.md) | `UserMarkdownlintObsidian.WorkspaceLint`, `UserMarkdownlintObsidian.TemporaryDisable`, `UserMarkdownlintObsidian.TrustedCustomRules`, `UserMarkdownlintObsidian.UnsupportedWorkspaceModes`, `UserMarkdownlintObsidian.ActionableErrors`, `UserMarkdownlintObsidian.MetadataConfidence` |

## Adaptation Notes

- The upstream `vscode-markdownlint` extension embeds `markdownlint-cli2`
  behavior. This extension must expose `markdownlint-obsidian` behavior instead.
- Flavor Grenade LSP is the planned owner of OFMarkdown document classification.
  This extension uses `ofmarkdown` as the live-lint eligibility signal.
- Requirements mention current core and CLI capabilities only when those
  capabilities exist today.
- Extension-specific affordances, such as pause/resume linting and config
  schema contributions, are proposed requirements for the extension baseline.
- Formatting is intentionally narrower than upstream markdownlint. The current
  core fix model supports safe line edits, not whole-document formatting.
