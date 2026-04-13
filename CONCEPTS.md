# Concepts

Domain vocabulary for `markdownlint-obsidian`. Terms used consistently across
source code, rule codes, and documentation.

## Block ID

A user-assigned anchor appended to a markdown block using the `^identifier`
syntax (e.g., `Some paragraph text ^my-anchor`). Block IDs make a paragraph
or list item addressable by other notes via a block reference link. Rules
OFM100–OFM104 govern their format and referential integrity.

**See also:** [Block Reference](#block-reference),
[docs/rules/block-references/](docs/rules/block-references/)

## Block Reference

A wikilink variant that targets a specific block in another note using the
`[[note#^blockid]]` syntax. Distinct from a heading link (`[[note#Heading]]`)
because it targets a block ID rather than a heading anchor. The vault index
must be built for block reference resolution to work.

**See also:** [Block ID](#block-id), [Vault Index](#vault-index),
[docs/rules/block-references/](docs/rules/block-references/)

## Callout

An Obsidian block-quote extension using the `> [!TYPE]` syntax, where `TYPE`
is a keyword such as `note`, `warning`, or `tip`. Callouts may be foldable
(`> [!TYPE]+` or `> [!TYPE]-`) and carry optional titles. Rules OFM040–OFM044
validate callout structure, known types, and fold flags.

**See also:** [docs/rules/callouts/](docs/rules/callouts/)

## Embed

An Obsidian transclusion directive written as `![[target]]`, optionally with
sizing hints (`![[image.png|400]]`). Embeds pull another vault file's content
or a media asset inline into the current note. Rules OFM020–OFM025 validate
embed syntax, target existence, extension allowlists, and size parameters.

**See also:** [Wikilink](#wikilink), [docs/rules/embeds/](docs/rules/embeds/)

## FileExistenceChecker

A domain interface (`src/domain/fs/FileExistenceChecker.ts`) that rules use
to probe whether a file path exists on disk. The infrastructure layer provides
a Node.js implementation; tests supply a stub. Rules must not import Node.js
`fs` directly — they must use the `fsCheck` field on `RuleParams`.

**See also:** [RuleParams](#ruleparams),
[packages/core AGENTS.md](packages/core/AGENTS.md)

## Fix

A structured edit instruction attached to a `LintError` when the rule can
determine the exact replacement needed. The fix engine in `FixUseCase` collects
fixes, resolves conflicts, and applies them in a single pass. A rule is
`fixable: true` only when it can supply a `Fix` for every violation it detects
(or omit `fix` for the subset it cannot handle).

**See also:** [LintError](#linterror), [OFMRule](#ofmrule),
[packages/core/src/domain/linting/](packages/core/src/domain/linting/)

## Formatter

An output adapter that converts a `LintResult[]` array into a string in one
of the supported formats: `default` (human-readable), `json`, `junit`, or
`sarif`. Registered in `FormatterRegistry`; the CLI and engine select one by
name via `--output-formatter`.

**See also:** [LintResult](#lintresult),
[packages/core/src/infrastructure/formatters/](packages/core/src/infrastructure/formatters/)

## LinterConfig

The user-facing configuration object loaded from `.obsidian-linter.jsonc`.
Carries per-family rule options (`WikilinkConfig`, `CalloutConfig`, etc.) plus
top-level flags (`resolve`, `globs`, `ignores`). Passed to every rule via
`RuleParams.config` at lint time. Validated by `ConfigValidator` on load.

**See also:** [RuleParams](#ruleparams),
[packages/core/src/domain/config/](packages/core/src/domain/config/)

## LintError

A single violation found by a rule, carrying `filePath`, `line`, `column`,
`ruleCode`, `ruleName`, `message`, `severity`, and optionally a `Fix`. Emitted
via the `OnErrorCallback` passed to `OFMRule.run`.

**See also:** [OFMRule](#ofmrule), [Fix](#fix), [LintResult](#lintresult)

## LintResult

An aggregate of all `LintError` instances found for one file during a lint
run. The engine collects one `LintResult` per file and passes the array to
the chosen formatter.

**See also:** [LintError](#linterror), [Formatter](#formatter)

## OFM (Obsidian Flavored Markdown)

The dialect of Markdown used by the Obsidian knowledge-base application.
Extends CommonMark with wikilinks, embeds, callouts, block references,
highlights (`==text==`), and inline comments (`%%...%%`). OFM constructs
are parsed by extractors in `infrastructure/parser/ofm/` and validated by
OFM-prefixed rules.

**See also:** [Wikilink](#wikilink), [Embed](#embed), [Callout](#callout),
[docs/ddd/ubiquitous-language.md](docs/ddd/ubiquitous-language.md)

## OFMRule

The interface every lint rule must implement
(`src/domain/linting/OFMRule.ts`). Defines `names`, `description`, `tags`,
`severity`, `fixable`, and a `run(params, onError)` method. Rules are
stateless — the same inputs always produce the same violations. Both built-in
rules and custom rules satisfy this interface.

**See also:** [RuleParams](#ruleparams), [Fix](#fix),
[packages/core/src/domain/linting/](packages/core/src/domain/linting/)

## ParseResult

The domain value object produced by parsing one Markdown file. Carries the
raw `lines` array, a `markdown-it` token tree, extracted `frontmatter`, and
typed arrays of OFM nodes: `wikilinks`, `embeds`, `callouts`, `tags`,
`blockRefs`, `highlights`, and `comments`. Every rule receives a `ParseResult`
via `RuleParams.parsed`.

**See also:** [RuleParams](#ruleparams),
[packages/core/src/domain/parsing/](packages/core/src/domain/parsing/)

## Rule Code

A short identifier for a lint rule following the pattern `OFMxxx` (OFM rules)
or `MDxxx` (standard markdownlint rules with overrides). OFM codes are grouped
by family: 001–019 wikilinks, 020–039 embeds, 040–059 callouts, 060–079 tags,
080–099 frontmatter, 100–119 block references, 120–139 highlights.

**See also:** [docs/rules/index.md](docs/rules/index.md)

## RuleParams

The per-file input bundle delivered to `OFMRule.run`. Contains `filePath`,
`parsed` (the `ParseResult`), `config` (the active `LinterConfig`), `vault`
(nullable `VaultIndex`), `fsCheck` (a `FileExistenceChecker`), and
`blockRefIndex` (nullable). Both `vault` and `blockRefIndex` are `null` when
`config.resolve === false`; rules that need them must guard on this.

**See also:** [OFMRule](#ofmrule), [VaultIndex](#vault-index),
[ParseResult](#parseresult)

## Vault

Obsidian's unit of linked notes: a directory tree of Markdown files that share
a common root. The linter detects the vault root automatically by walking up
from the target files to find a `.obsidian` directory, or accepts an explicit
`--vault-root` override. Resolution of wikilinks and embeds is vault-relative.

**See also:** [Vault Index](#vault-index), [VaultPath](#vaultpath)

## Vault Index

An in-memory index of every `.md` file in a vault, built once per lint run
by `VaultBootstrap`. Rules resolve wikilink targets through
`VaultIndex.resolve`; the result is a `MatchResult` carrying the matched
`VaultPath` or a reason for failure. Built only when `config.resolve === true`.

**See also:** [Vault](#vault), [VaultPath](#vaultpath),
[packages/core/src/domain/vault/](packages/core/src/domain/vault/)

## VaultPath

A normalized, vault-relative file path value object. Used throughout the
domain and vault layers to avoid passing raw strings that could be
accidentally compared with absolute paths.

**See also:** [Vault Index](#vault-index)

## Wikilink

Obsidian's internal link syntax: `[[Target Note]]`, optionally with a display
alias (`[[Target|Alias]]`), a heading anchor (`[[Target#Heading]]`), or a
block reference (`[[Target#^blockid]]`). Wikilinks are the primary navigation
mechanism in a vault. Rules OFM001–OFM007 validate their format, target
resolution, and casing.

**See also:** [Embed](#embed), [Block Reference](#block-reference),
[docs/rules/wikilinks/](docs/rules/wikilinks/)
