Feature: Configuration and trust

  Extension configuration and code-loading behavior must match project linting
  intent while respecting VS Code workspace trust and supported file-system
  modes.

  @MarkdownlintObsidian.ConfigurationResolution @UserMarkdownlintObsidian.ConfigSources
  Scenario: Supported config files shape live diagnostics
    Given a workspace contains a supported markdownlint-obsidian config file
    And a visible OFMarkdown document has diagnostics affected by that config
    When the extension resolves effective configuration
    Then live diagnostics reflect the resolved configuration
    And the output does not report a configuration mismatch with the core package

  @MarkdownlintObsidian.ConfigParityDelegation @UserMarkdownlintObsidian.ConfigSources
  Scenario: markdownlint-cli2 parity comes from the core library
    Given a workspace uses markdownlint-cli2-style config discovery
    And the core library resolves different effective configs for nested files
    When the extension lints those files
    Then extension diagnostics use the core effective config for each file
    And the extension does not reimplement the config cascade

  @MarkdownlintObsidian.SchemaValidation @UserMarkdownlintObsidian.SchemaAssistance
  Scenario: Supported JSON config files receive schema assistance
    Given the author opens a supported JSON or JSONC linter config file
    When VS Code asks for validation metadata
    Then the extension provides the markdownlint-obsidian schema for that config file
    And unsupported config filenames are not claimed by the schema contribution

  @MarkdownlintObsidian.CustomRuleTrust @UserMarkdownlintObsidian.CustomRules
  Scenario: Trusted workspaces can load configured custom rules
    Given the workspace is trusted
    And the effective configuration names a local custom rule module
    When the extension lints an eligible document
    Then the custom rule module is allowed to load
    And custom rule diagnostics can appear in editor feedback

  @MarkdownlintObsidian.CustomRuleTrust @UserMarkdownlintObsidian.TrustedCustomRules
  Scenario: Untrusted workspaces block custom rule loading
    Given the workspace is untrusted
    And the effective configuration names a local custom rule module
    When the extension lints an eligible document
    Then custom rule modules are not loaded
    And the output channel explains that workspace trust blocks custom rules

  @MarkdownlintObsidian.WorkspaceTrust @UserMarkdownlintObsidian.UnsupportedWorkspaceModes
  Scenario: Trust policy controls write-capable behavior
    Given the workspace trust policy forbids file writes
    When the author invokes a fix command
    Then the extension does not write workspace files
    And the command reports the trust policy reason

  @MarkdownlintObsidian.FileSystemStrategy @UserMarkdownlintObsidian.UnsupportedWorkspaceModes
  Scenario: Unsupported file-system operations fail visibly
    Given the workspace mode cannot support vault lookup or fix writes
    When the extension needs that file-system operation
    Then the operation is rejected intentionally
    And the output identifies the unsupported operation and workspace mode
