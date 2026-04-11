# Ubiquitous Language

Canonical terms for the `markdownlint-obsidian` domain. All code, docs, and BDD scenarios use these exact names.

## Linting Bounded Context

| Term | Definition |
|---|---|
| **LintError** | A single rule violation: error code, line, column, message, severity |
| **LintResult** | The complete set of LintErrors for one file |
| **LintRun** | A full execution: file set + config → aggregated LintResults |
| **Rule** | A named, versioned unit of validation logic (OFM001, MD001, etc.) |
| **RuleRegistry** | The ordered collection of active Rules for a given LintRun |
| **Severity** | `error` (fails CI) or `warning` (reported but does not fail) |
| **Fixable** | A Rule that can automatically repair its violation in-place |

## Vault Bounded Context

| Term | Definition |
|---|---|
| **Vault** | An Obsidian workspace — a directory tree rooted at a folder containing `.obsidian/` |
| **VaultRoot** | The absolute path to the vault's root directory |
| **VaultIndex** | An in-memory map of all `.md` files in the vault, keyed by normalized path |
| **Wikilink** | An Obsidian internal link: `[[target]]`, `[[target\|alias]]`, `[[target#heading]]` |
| **Embed** | An Obsidian file transclusion: `![[file]]`, `![[file\|width]]` |
| **BlockRef** | A block-level anchor (`^blockid`) or reference (`[[page#^blockid]]`) |
| **Callout** | An Obsidian admonition block: `> [!TYPE] Title` |
| **Resolution** | The process of matching a Wikilink target to an actual file in the VaultIndex |

## Config Bounded Context

| Term | Definition |
|---|---|
| **LinterConfig** | The fully merged, validated configuration for a LintRun |
| **ConfigCascade** | The ordered search from a file's directory up to vault root for config files |
| **RuleConfig** | Per-rule enable/disable flag and options object |
| **InlineDisable** | An HTML comment suppressing rules for a region of a file |
