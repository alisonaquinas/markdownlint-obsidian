@smoke
Feature: Frontmatter linting

  Scenario: Missing required key reports OFM080
    Given a file "notes/index.md" with frontmatter missing "tags"
    And the config requires frontmatter key "tags"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM080 is reported

  Scenario: Invalid date format reports OFM081
    Given a file "notes/index.md" with frontmatter "created: not-a-date"
    And the config declares "created" as a date field
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM081 is reported

  Scenario: Valid frontmatter passes
    Given a file "notes/index.md" with frontmatter "tags: [project]" and "created: 2026-04-11"
    And the config requires frontmatter key "tags" and declares "created" as a date field
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 0
