Feature: Packaging and metadata

  Published extension metadata must expose the VS Code contributions
  and describe the engine behavior that the extension actually uses.

  @MarkdownlintObsidian.ManifestContributions @UserMarkdownlintObsidian.FlavorGrenadeDependency
  Scenario: Manifest declares the Flavor Grenade dependency
    Given the extension package manifest is inspected
    When dependency contribution points are evaluated
    Then `alisonaquinas.flavor-grenade-lsp` is declared as an extension dependency
    And automatic activation is tied to OFMarkdown behavior instead of all Markdown documents

  @MarkdownlintObsidian.ManifestContributions @UserMarkdownlintObsidian.AutomaticActivation
  Scenario: Manifest contributes native VS Code commands and settings
    Given the extension package manifest is inspected
    When contribution points are evaluated
    Then documented commands, settings, menus, activation events, and validation paths are present
    And each contribution uses the documented markdownlint-obsidian ids and defaults

  @MarkdownlintObsidian.MetadataConsistency @UserMarkdownlintObsidian.RuleFamilyVisibility
  Scenario: Rule metadata preserves markdownlint-obsidian rule families
    Given the extension contributes diagnostic metadata or documentation links
    When OFM, system, standard Markdown, or custom rule diagnostics are shown
    Then built-in rule families and rule codes remain visible to the author
    And custom rules are not misrepresented as built-in rule documentation

  @MarkdownlintObsidian.MetadataConsistency @UserMarkdownlintObsidian.MetadataConfidence
  Scenario: Published metadata matches the declared lint engine
    Given the extension package is prepared for release
    When release metadata checks run
    Then the extension package version, declared markdownlint-obsidian engine version, schema version, README links, changelog links, and rule docs agree
    And release checks fail if any checked metadata describes a different engine behavior
