Feature: Fixes and formatting

  The extension exposes core-provided fixes through VS Code actions while
  preserving the boundary between lint fixes and general Markdown formatting.

  Background:
    Given a visible OFMarkdown document has markdownlint-obsidian diagnostics

  @MarkdownlintObsidian.CodeActions @MarkdownlintObsidian.QuickFix @UserMarkdownlintObsidian.QuickFix
  Scenario: A diagnostic with a core fix offers a quick fix
    Given a diagnostic contains a core fix payload
    When the author requests code actions for that diagnostic
    Then the extension offers a preferred quick fix
    And the quick fix applies the equivalent edit to the current document

  @MarkdownlintObsidian.QuickFix @UserMarkdownlintObsidian.QuickFix
  Scenario: Stale quick fixes do not edit changed text
    Given a diagnostic was produced for an earlier document version
    And the document has changed since that diagnostic was published
    When the author invokes the diagnostic quick fix
    Then the extension does not apply an unsafe stale edit
    And the author receives visible output explaining why the fix was skipped

  @MarkdownlintObsidian.FixAll @UserMarkdownlintObsidian.FixAllDocument
  Scenario: Fix all applies every safe document fix
    Given the current OFMarkdown document has fixable and non-fixable diagnostics
    When the author invokes fix all for the document
    Then all non-conflicting core fixes are applied
    And non-fixable diagnostics remain available after the document is re-linted

  @MarkdownlintObsidian.FixCheckPreview @UserMarkdownlintObsidian.FixCheckPreview
  Scenario: Fix preview reports available fixes without writing files
    Given the workspace contains files with available core fixes
    When the author runs the fix preview command
    Then the extension reports which files have available fixes
    And no workspace file content is changed

  @MarkdownlintObsidian.RuleHelp @UserMarkdownlintObsidian.RuleHelp
  Scenario: Built-in rule diagnostics link to documentation
    Given a diagnostic has a built-in OFM, system, or standard Markdown rule code
    When the author requests help for the diagnostic
    Then the extension opens the matching rule documentation

  @MarkdownlintObsidian.FormattingBoundary @UserMarkdownlintObsidian.NoUnsafeFormatting
  Scenario: Format document does not perform unsupported lint rewrites
    Given the extension cannot map Format Document to documented safe core fixes
    When VS Code asks for document formatting
    Then the extension does not perform whole-document Markdown formatting
    And lint fixes remain available through code actions or commands
