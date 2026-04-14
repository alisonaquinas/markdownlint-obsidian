# AGENTS.md — Guide for AI Agents Working in `packages/core/src/infrastructure`

Infrastructure layer: concrete adapters that implement domain interfaces using
Node.js, `markdown-it`, `globby`, and other external libraries. All I/O lives
here; the domain layer never imports from this tree.

## Layout

```text
src/infrastructure/
├── config/
│   ├── ConfigLoader.ts       # reads and parses .obsidian-linter.jsonc
│   ├── ConfigValidator.ts    # validates config shape against domain types
│   ├── CustomRuleLoader.ts   # dynamically imports user-supplied rule modules
│   └── defaults.ts           # default LinterConfig values
├── discovery/
│   └── FileDiscovery.ts      # glob expansion via globby
├── formatters/
│   ├── DefaultFormatter.ts   # human-readable file:line:col output
│   ├── JsonFormatter.ts      # JSON array of LintResult
│   ├── JUnitFormatter.ts     # JUnit XML (Jenkins / GitLab / Azure)
│   ├── SarifFormatter.ts     # SARIF 2.1.0 (GitHub code scanning)
│   └── FormatterRegistry.ts  # name → formatter lookup
├── fs/
│   └── NodeFsExistenceChecker.ts  # FileExistenceChecker backed by fs.access
├── io/
│   ├── FileReader.ts         # reads a file as UTF-8 string
│   └── FileWriter.ts         # writes a string back to disk
├── parser/
│   ├── FrontmatterParser.ts  # gray-matter wrapper; extracts YAML frontmatter
│   ├── MarkdownItParser.ts   # markdown-it tokenizer + OFM extractor pipeline
│   └── ofm/                  # per-node OFM extractors
│       ├── BlockRefExtractor.ts
│       ├── CalloutExtractor.ts
│       ├── CodeRegionMap.ts      # tracks fenced code spans to suppress false positives
│       ├── CommentExtractor.ts
│       ├── EmbedExtractor.ts
│       ├── HighlightExtractor.ts
│       ├── TagExtractor.ts
│       └── WikilinkExtractor.ts
├── rules/
│   ├── ofm/                  # built-in OFM rules grouped by family
│   │   ├── wikilinks/        # OFM001–OFM007
│   │   ├── embeds/           # OFM020–OFM025
│   │   ├── callouts/         # OFM040–OFM044
│   │   ├── tags/             # OFM060–OFM066
│   │   ├── frontmatter/      # OFM080–OFM087
│   │   ├── block-references/ # OFM100–OFM104
│   │   ├── highlights/       # OFM120–OFM124
│   │   ├── system/           # OFM904 (frontmatter parse error), OFM905
│   │   └── registerBuiltin.ts
│   ├── standard/
│   │   ├── MarkdownLintAdapter.ts    # bridges markdownlint rules to OFMRule
│   │   ├── StandardRuleAdapter.ts   # per-rule shim
│   │   ├── OFM_MD_CONFLICTS.ts      # list of standard rules disabled due to OFM conflicts
│   │   └── registerStandard.ts
│   └── registerCustom.ts     # loads and registers user-supplied custom rules
└── vault/
    ├── FileIndexBuilder.ts        # builds VaultIndex from disk
    ├── BlockRefIndexBuilder.ts    # builds BlockRefIndex by scanning ^blockid lines
    ├── GitRootFinder.ts           # walks up to find .git for vault-root detection
    └── NodeFsVaultDetector.ts     # VaultDetector backed by Node.js fs
```

## Workflows

### Adding an OFM extractor

1. Create `ofm/<Name>Extractor.ts` — parse markdown-it tokens and return
   the node array.
2. Call the extractor inside `MarkdownItParser.ts` and merge results into
   the `ParseResult`.
3. Add the corresponding node type in `domain/parsing/`.

### Adding a formatter

1. Implement `(results: LintResult[]) => string` in
   `formatters/<Name>Formatter.ts`.
2. Register it in `FormatterRegistry.ts`.
3. Expose via `engine/index.ts:getFormatter`.

## Invariants — Do Not Violate

- Infrastructure may import from `domain/` but never the other way around.
- Rule files in `rules/ofm/` must implement `OFMRule` from `domain/linting/`
  and must not import Node.js `fs` directly.
- `CodeRegionMap` must be consulted by extractors before reporting any OFM
  node inside a fenced code block. Violations inside code fences are false
  positives.
- `OFM_MD_CONFLICTS.ts` is the authoritative list of standard `markdownlint`
  rules that are suppressed because they conflict with OFM syntax. Edit that
  list whenever a new OFM rule supersedes a standard one.

## See Also

- [packages/core AGENTS.md](../../AGENTS.md)
- [src/domain AGENTS.md](../domain/AGENTS.md)
- [Root AGENTS.md](../../../../AGENTS.md)
- [CONCEPTS.md](../../../../CONCEPTS.md)
