@smoke
Feature: Tag linting

  Scenario: Invalid tag format reports OFM060
    Given a file "notes/tags.md" containing "Body #a//b"
    When I run markdownlint-obsidian on "notes/tags.md"
    Then the exit code is 1
    And error OFM060 is reported on line 1

  Scenario: Nested tag beyond maxDepth reports OFM061
    Given a config file with "tags.maxDepth" set to 2
    And a file "notes/tags.md" containing "Body #a/b/c"
    When I run markdownlint-obsidian on "notes/tags.md"
    Then the exit code is 1
    And error OFM061 is reported on line 1

  Scenario: Valid tag passes
    Given a file "notes/tags.md" containing "Body #project/meta"
    When I run markdownlint-obsidian on "notes/tags.md"
    Then the exit code is 0
