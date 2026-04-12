@smoke
Feature: Block reference linting

  Scenario: Valid block reference passes
    Given a file "notes/a.md" containing:
      """
      # A

      Paragraph ^one
      """
    And a file "notes/b.md" containing "See [[a#^one]]"
    When I run markdownlint-obsidian on "notes/b.md"
    Then the exit code is 0

  Scenario: Broken block link reports OFM102
    Given a file "notes/a.md" containing:
      """
      # A

      Paragraph ^one
      """
    And a file "notes/b.md" containing "See [[a#^missing]]"
    When I run markdownlint-obsidian on "notes/b.md"
    Then the exit code is 1
    And error OFM102 is reported on line 1

  Scenario: Duplicate block id reports OFM101
    Given a file "notes/dup.md" containing:
      """
      first ^same

      second ^same
      """
    When I run markdownlint-obsidian on "notes/dup.md"
    Then the exit code is 1
    And error OFM101 is reported on line 3
