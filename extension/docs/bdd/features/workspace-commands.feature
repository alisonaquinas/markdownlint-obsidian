Feature: Workspace commands

  Command Palette actions give maintainers workspace-level linting,
  configuration access, temporary control over diagnostics, and useful output.

  @MarkdownlintObsidian.WorkspaceLint @UserMarkdownlintObsidian.WorkspaceLint
  Scenario: Workspace lint uses effective project configuration
    Given the workspace contains configured Markdown file globs and ignores
    When the maintainer runs workspace lint
    Then the extension lints the configured workspace files
    And the output reports lint results or an actionable error for each workspace folder

  @MarkdownlintObsidian.OpenConfigFile @UserMarkdownlintObsidian.ConfigDiscovery
  Scenario: Open config opens the nearest supported config file
    Given the active document belongs to a workspace with a supported config file
    When the author runs open config
    Then the extension opens the nearest supported config file for that document

  @MarkdownlintObsidian.OpenConfigFile @UserMarkdownlintObsidian.ConfigDiscovery
  Scenario: Open config creates a starter draft when no config exists
    Given the active workspace has no supported linter config file
    When the author runs open config
    Then the extension opens an untitled starter `.obsidian-linter.jsonc` draft
    And the draft is valid as a starting linter configuration

  @MarkdownlintObsidian.ToggleLinting @UserMarkdownlintObsidian.TemporaryDisable
  Scenario: Temporary disable clears live diagnostics
    Given live linting is enabled
    And visible eligible documents have markdownlint-obsidian diagnostics
    When the author toggles live linting off
    Then the extension clears its diagnostic collection
    And no persistent linter configuration is changed

  @MarkdownlintObsidian.ToggleLinting @UserMarkdownlintObsidian.TemporaryDisable
  Scenario: Re-enabling live linting refreshes visible eligible documents
    Given live linting was temporarily disabled
    When the author toggles live linting on
    Then the extension requests live lint for visible eligible documents
    And generic Markdown documents remain outside automatic live linting

  @MarkdownlintObsidian.ConfigurationWatchers @UserMarkdownlintObsidian.CurrentDiagnostics
  Scenario: Config changes refresh visible diagnostics
    Given a supported linter config file changes in the workspace
    When the configuration watcher observes the change
    Then diagnostics for visible eligible documents are refreshed
    And removed workspace folders no longer keep active configuration watchers

  @MarkdownlintObsidian.ErrorReporting @UserMarkdownlintObsidian.ActionableErrors
  Scenario: Command failures are visible
    Given a workspace command cannot complete
    When the extension handles the command failure
    Then the output channel reports the command, affected scope, and failure message
    And the command does not fail silently
