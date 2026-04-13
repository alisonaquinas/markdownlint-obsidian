@smoke
Feature: Wikilink linting

  Background:
    Given a vault with a file "notes/existing.md"

  Scenario: Broken wikilink reports OFM001
    Given a file "notes/index.md" containing "[[missing-page]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM001 is reported on line 1

  Scenario: Valid wikilink passes
    Given a file "notes/index.md" containing "[[existing]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 0

  Scenario: Resolution can be disabled
    Given a file "notes/index.md" containing "[[missing-page]]"
    When I run markdownlint-obsidian on "notes/index.md" with "--no-resolve"
    Then the exit code is 0

  Scenario: Alias wikilink with valid target passes
    Given a file "notes/index.md" containing "[[existing|display text]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 0

  Scenario: Wikilink to heading validates page exists
    Given a file "notes/index.md" containing "[[existing#some-heading]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 0

  Scenario: Malformed wikilink reports OFM002
    Given a file "notes/index.md" containing "[[]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM002 is reported on line 1
