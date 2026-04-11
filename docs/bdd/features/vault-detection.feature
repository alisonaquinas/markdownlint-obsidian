Feature: Vault root detection

  Scenario: Detects vault root via .obsidian/ directory
    Given a directory tree with ".obsidian/" at "vault/"
    And a file "vault/notes/index.md" containing "[[missing]]"
    When I run markdownlint-obsidian on "vault/notes/index.md"
    Then the vault root is resolved to "vault/"
    And error OFM001 is reported (missing-page not in vault)

  Scenario: Falls back to git root when no .obsidian/ found
    Given a git repo root at "repo/" with no ".obsidian/" directory
    And a file "repo/docs/index.md" containing "[[missing]]"
    When I run markdownlint-obsidian on "repo/docs/index.md"
    Then the vault root is resolved to "repo/"

  Scenario: Explicit vaultRoot in config overrides auto-detection
    Given a directory tree with ".obsidian/" at "vault/"
    And a config file setting vaultRoot to "vault/notes/"
    And a file "vault/notes/index.md"
    When I run markdownlint-obsidian on "vault/notes/index.md"
    Then the vault root is resolved to "vault/notes/"

  Scenario: No vault root found exits with OFM900
    Given a directory with no ".obsidian/" and no git repo
    And a file "notes/index.md"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 2
    And error OFM900 is reported
