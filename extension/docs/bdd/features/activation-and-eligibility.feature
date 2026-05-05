Feature: Activation and document eligibility

  The extension depends on Flavor Grenade for OFMarkdown classification.
  Automatic live linting is available only for documents that Flavor Grenade
  has promoted to the OFMarkdown language mode.

  Background:
    Given Flavor Grenade is installed and enabled
    And live linting is enabled for the extension session

  @MarkdownlintObsidian.ExtensionDependency @UserMarkdownlintObsidian.FlavorGrenadeDependency
  Scenario: Missing Flavor Grenade dependency blocks automatic live linting
    Given Flavor Grenade is missing
    When an Obsidian vault note is opened
    Then the extension reports a missing dependency state
    And automatic live linting does not start for the document

  @MarkdownlintObsidian.Activation @UserMarkdownlintObsidian.AutomaticActivation
  Scenario: OFMarkdown document activates extension feedback
    Given a vault note is classified as an OFMarkdown document
    When the document becomes visible in VS Code
    Then markdownlint-obsidian commands are available
    And the document is considered eligible for live linting

  @MarkdownlintObsidian.DocumentEligibility @UserMarkdownlintObsidian.OFMRelevantDocuments
  Scenario: Generic Markdown documents are not live-linted by default
    Given a document is classified as generic Markdown
    When the document becomes visible in VS Code
    Then the document is not considered eligible for live linting
    And no markdownlint-obsidian diagnostics are published for it automatically

  @MarkdownlintObsidian.DocumentEligibility @UserMarkdownlintObsidian.OFMRelevantDocuments
  Scenario: OFMarkdown language changes update eligibility
    Given a visible document is classified as generic Markdown
    When Flavor Grenade changes the document language to OFMarkdown
    Then the document becomes eligible for live linting
    And the extension requests lint feedback for the current document version

  @MarkdownlintObsidian.DocumentEligibility @UserMarkdownlintObsidian.UnsupportedWorkspaceModes
  Scenario: Unsupported document storage is rejected with a visible reason
    Given an OFMarkdown document uses an unsupported storage scheme
    When the extension evaluates document eligibility
    Then the document is not linted automatically
    And the output channel explains which workspace mode is unsupported
