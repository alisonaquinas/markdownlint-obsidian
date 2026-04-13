Feature: CI exit codes

  @smoke
  Scenario: Clean vault exits 0
    Given a vault with no lint errors
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 0

  @smoke
  Scenario: Lint errors exit 1
    Given a vault with a broken wikilink
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 1

  @smoke
  Scenario: Config error exits 2
    Given a config file with invalid JSON
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 2

  @smoke
  Scenario: Warnings do not affect exit code
    Given a file with a warning-severity rule violation
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 0
