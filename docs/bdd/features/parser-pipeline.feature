Feature: Parser pipeline smoke

  @smoke
  Scenario: Broken frontmatter produces OFM902
    Given a file "notes/bad.md" containing:
      """
      ---
       : invalid :
      ---
      body
      """
    When I run markdownlint-obsidian on "notes/bad.md"
    Then the exit code is 1
    And error OFM902 is reported on line 1

  @smoke
  Scenario: Clean file with OFM content parses cleanly
    Given a vault with a file "notes/target.md"
    And a file "notes/ok.md" containing:
      """
      # Hi

      [[target]] and #tag here.
      """
    When I run markdownlint-obsidian on "notes/ok.md"
    Then the exit code is 0
