Feature: Live diagnostics

  Eligible OFMarkdown documents receive diagnostics that reflect current text,
  effective configuration, and vault-aware lint context.

  Background:
    Given Flavor Grenade is installed and enabled
    And a visible document is eligible for live linting

  @MarkdownlintObsidian.LintTrigger @UserMarkdownlintObsidian.RunModeControl
  Scenario: On-type mode refreshes diagnostics after edits
    Given the run mode is on type
    When the author changes the eligible document
    Then the extension requests a live lint for the current document version
    And the diagnostic collection reflects the new lint result

  @MarkdownlintObsidian.LintTrigger @UserMarkdownlintObsidian.RunModeControl
  Scenario: On-save mode waits for save before refreshing diagnostics
    Given the run mode is on save
    When the author changes the eligible document without saving
    Then the extension does not request a live lint for the unsaved edit
    When the author saves the document
    Then the extension requests a live lint for the saved document version

  @MarkdownlintObsidian.Diagnostics @UserMarkdownlintObsidian.CurrentDiagnostics
  Scenario: Lint errors become VS Code diagnostics
    Given the core linter reports OFM and standard Markdown lint errors
    When the extension projects the lint result
    Then each reportable lint error appears in the Problems panel
    And each diagnostic preserves the rule code, severity, source, message, and location

  @MarkdownlintObsidian.Diagnostics @UserMarkdownlintObsidian.CurrentDiagnostics
  Scenario: Stale diagnostics are cleared
    Given diagnostics were published for an earlier document version
    When a newer live lint result completes for the same document
    Then stale diagnostics are removed from the diagnostic collection
    And only diagnostics for the newest eligible state remain visible

  @MarkdownlintObsidian.ConfigurationResolution @UserMarkdownlintObsidian.ConfigSources
  Scenario: Effective configuration controls diagnostics
    Given the workspace has supported markdownlint-obsidian configuration
    When the extension lints an eligible document
    Then the lint run uses the same effective linter configuration as the core package
    And editor-only overrides are applied only when they are documented

  @MarkdownlintObsidian.Diagnostics @UserMarkdownlintObsidian.VaultAwareFeedback
  Scenario: Vault-aware diagnostics use the resolved vault context
    Given the eligible document belongs to an Obsidian vault
    And the document contains vault-dependent references
    When the extension requests lint feedback
    Then link, embed, and block-reference diagnostics use the resolved vault context
    And unavailable vault resolution is reported as actionable output

  @MarkdownlintObsidian.ErrorReporting @UserMarkdownlintObsidian.ActionableErrors
  Scenario: Lint failures produce actionable output
    Given the core lint request fails before diagnostics can be projected
    When the extension handles the failure
    Then the output channel includes the affected document and failure message
    And stale diagnostics are not left visible as current feedback
