# BDD Traceability

This map keeps extension behavior scenarios connected to requirements and DDD
contexts.

## Feature Coverage

| Feature | User Requirements | Functional Requirements | DDD Contexts |
| :--- | :--- | :--- | :--- |
| [Activation and eligibility](features/activation-and-eligibility.feature) | `UserMarkdownlintObsidian.FlavorGrenadeDependency`, `UserMarkdownlintObsidian.AutomaticActivation`, `UserMarkdownlintObsidian.OFMRelevantDocuments` | `MarkdownlintObsidian.ExtensionDependency`, `MarkdownlintObsidian.Activation`, `MarkdownlintObsidian.DocumentEligibility` | Editor Client |
| [Live diagnostics](features/live-diagnostics.feature) | `UserMarkdownlintObsidian.CurrentDiagnostics`, `UserMarkdownlintObsidian.RunModeControl`, `UserMarkdownlintObsidian.VaultAwareFeedback`, `UserMarkdownlintObsidian.ActionableErrors` | `MarkdownlintObsidian.LintTrigger`, `MarkdownlintObsidian.ConfigurationResolution`, `MarkdownlintObsidian.Diagnostics`, `MarkdownlintObsidian.ErrorReporting` | Lint Feedback, Configuration And Trust |
| [Fixes and formatting](features/fixes-and-formatting.feature) | `UserMarkdownlintObsidian.QuickFix`, `UserMarkdownlintObsidian.FixAllDocument`, `UserMarkdownlintObsidian.FixCheckPreview`, `UserMarkdownlintObsidian.RuleHelp`, `UserMarkdownlintObsidian.NoUnsafeFormatting` | `MarkdownlintObsidian.CodeActions`, `MarkdownlintObsidian.QuickFix`, `MarkdownlintObsidian.FixAll`, `MarkdownlintObsidian.FixCheckPreview`, `MarkdownlintObsidian.FormattingBoundary`, `MarkdownlintObsidian.RuleHelp` | Fix Workflow, Lint Feedback |
| [Configuration and trust](features/configuration-and-trust.feature) | `UserMarkdownlintObsidian.ConfigSources`, `UserMarkdownlintObsidian.ConfigDiscovery`, `UserMarkdownlintObsidian.SchemaAssistance`, `UserMarkdownlintObsidian.CustomRules`, `UserMarkdownlintObsidian.TrustedCustomRules`, `UserMarkdownlintObsidian.UnsupportedWorkspaceModes` | `MarkdownlintObsidian.ConfigurationResolution`, `MarkdownlintObsidian.SchemaValidation`, `MarkdownlintObsidian.WorkspaceTrust`, `MarkdownlintObsidian.CustomRuleTrust`, `MarkdownlintObsidian.FileSystemStrategy` | Configuration And Trust |
| [Workspace commands](features/workspace-commands.feature) | `UserMarkdownlintObsidian.WorkspaceLint`, `UserMarkdownlintObsidian.TemporaryDisable`, `UserMarkdownlintObsidian.ActionableErrors` | `MarkdownlintObsidian.WorkspaceLint`, `MarkdownlintObsidian.OpenConfigFile`, `MarkdownlintObsidian.ToggleLinting`, `MarkdownlintObsidian.ConfigurationWatchers`, `MarkdownlintObsidian.ErrorReporting` | Workspace Commands, Lint Feedback |
| [Packaging and metadata](features/packaging-and-metadata.feature) | `UserMarkdownlintObsidian.FlavorGrenadeDependency`, `UserMarkdownlintObsidian.RuleFamilyVisibility`, `UserMarkdownlintObsidian.MetadataConfidence` | `MarkdownlintObsidian.ManifestContributions`, `MarkdownlintObsidian.MetadataConsistency` | Editor Client, Configuration And Trust |

## Automation Boundary

These BDD scenarios should not become the only test suite. They specify shared
extension behavior. Lower-level tests should cover:

- OFM syntax parsing and lint-rule variants.
- config loader precedence and validation branches;
- fix conflict sorting and edit normalization;
- custom rule loader edge cases;
- VS Code adapter helpers that have many technical cases but little product
  value as Gherkin.

## Collaboration Checkpoints

- Review scenario vocabulary before step bindings are written.
- Confirm whether each scenario is best automated by manifest inspection,
  extension-host integration, component test, or core test.
- Keep scenario text stable when command ids, classes, or internal adapters
  change.
- Add a new scenario only when it states a rule that should remain visible to
  non-implementation reviewers.
