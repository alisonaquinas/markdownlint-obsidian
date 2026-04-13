@smoke
Feature: Embed linting

  Scenario: Disallowed extension reports OFM024
    Given a file "notes/index.md" containing "![[script.exe]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM024 is reported on line 1

  Scenario: Valid markdown embed passes
    Given a vault with a file "notes/target.md"
    And a file "notes/index.md" containing "![[target]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 0

  Scenario: Broken markdown embed reports OFM020
    Given a file "notes/index.md" containing "![[missing]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM020 is reported on line 1
