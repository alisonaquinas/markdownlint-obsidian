Feature: Custom rules API

  @smoke
  Scenario: Custom rule fires on matching note
    Given a vault with a custom rule that always fires
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 1
    And error DEMO001 is reported

  @smoke
  Scenario: Custom rule load failure is tolerated
    Given a vault with a customRules entry pointing to a missing file
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 0
    And stderr contains "OFM905"
