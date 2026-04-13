@smoke
Feature: Highlight linting

  Scenario: Default allows highlights
    Given a file "notes/x.md" containing "==highlighted=="
    When I run markdownlint-obsidian on "notes/x.md"
    Then the exit code is 0

  Scenario: Config can disallow highlights
    Given a config file disabling highlights
    And a file "notes/x.md" containing "==nope=="
    When I run markdownlint-obsidian on "notes/x.md"
    Then the exit code is 1
    And error OFM120 is reported on line 1
