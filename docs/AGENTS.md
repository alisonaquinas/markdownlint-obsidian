# AGENTS.md — Guide for AI Agents Working in `docs/`

Reference and design documentation tree. This directory is not source code —
it is the human-readable knowledge base for contributors and integrators.
The docs dogfood lint run (`bun run test:dogfood:docs`) lints `docs/**/*.md`
with the built CLI, so every file here must pass the linter. The aggregate
`bun run test:dogfood` also lints `extension/docs/`.

## Layout

```text
docs/
├── README.md              # index of this directory (this file's sibling)
├── AGENTS.md              # this file
├── roadmap.md             # phased delivery roadmap
├── assets/                # brand assets (logo PNGs, SVGs, icon variants)
├── rules/
│   ├── index.md           # cross-reference index of all rule codes
│   ├── standard-md/       # standard markdownlint rules with OFM override notes
│   ├── wikilinks/         # OFM001–OFM007
│   ├── embeds/            # OFM020–OFM025
│   ├── callouts/          # OFM040–OFM044
│   ├── tags/              # OFM060–OFM066
│   ├── frontmatter/       # OFM080–OFM087
│   ├── block-references/  # OFM100–OFM104
│   ├── highlights/        # OFM120–OFM124
│   ├── system/            # OFM904, OFM905
│   └── custom/            # docs for example custom rules
├── guides/
│   ├── install.md
│   ├── ci-integration.md
│   ├── autofix.md
│   ├── custom-rules.md
│   └── public-api.md
├── adr/                   # Architecture Decision Records (ADR001–ADR007)
├── architecture/          # Binding architecture policy docs
├── ddd/
│   ├── ubiquitous-language.md
│   ├── bounded-contexts.md
│   └── <context>/domain-model.md   # per-context domain model
├── plans/                 # phase execution plans + execution-ledger.md
├── bdd/                   # BDD feature files and step definitions
│   ├── features/
│   └── steps/
└── superpowers/           # design specs and implementation plans
```

## Workflows

### Adding a rule doc

1. Create `docs/rules/<family>/OFMxxx.md` using an existing rule doc as a
   template.
2. Add an entry to `docs/rules/index.md`.
3. Run `bun run test:dogfood:docs` to confirm the new file passes the linter.

### Adding a guide

1. Create `docs/guides/<slug>.md`.
2. Add a row to the guides table in `docs/README.md`.
3. Run `bun run test:dogfood:docs`.

### Adding an ADR

1. Create `docs/adr/ADRxxx-<slug>.md` with the next sequential number.
2. Add a row to the ADR table in `docs/README.md`.

## Invariants — Do Not Violate

- All markdown in `docs/` must pass `bun run test:dogfood:docs` (which runs
  `markdownlint-obsidian docs/**/*.md`). Do not add content that would create
  a lint violation.
- ADRs are append-only. Once ratified, an ADR's decision section must not
  change. Write a superseding ADR instead.
- `plans/` is a historical record. Plans are not retroactively edited;
  `execution-ledger.md` captures what actually happened.
- Do not place build artifacts or generated files in `docs/`. The only
  exception is `docs/assets/` which holds committed logo files stored in
  Git LFS.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [CONCEPTS.md](../CONCEPTS.md)
- [docs/rules/index.md](rules/index.md)
- [packages/core AGENTS.md](../packages/core/AGENTS.md)
