# AGENTS.md - Guide for AI Agents Working in `extension/docs/`

Documentation tree for the planned `markdownlint-obsidian` VS Code extension.
This directory is not extension source code. It is the planning and reference
wiki for extension behavior, architecture, requirements, release decisions, and
research. The extension docs dogfood lint run
(`bun run test:dogfood:extension-docs`) lints this tree with
`markdownlint-obsidian`; the aggregate `bun run test:dogfood` also runs it.

## Layout

```text
extension/docs/
├── README.md              # index of this extension documentation tree
├── AGENTS.md              # this file
├── architecture/          # extension architecture and data-flow notes
├── bdd/                   # behavior scenarios and traceability
├── ddd/                   # extension bounded contexts and ubiquitous language
├── requirements/          # user and functional requirements
├── tests/                 # unit, verification, validation, and automation plans
├── plans/                 # delivery plans and execution notes
├── research/              # supporting research for extension decisions
└── adr/                   # extension-specific Architecture Decision Records
```

## Workflows

### Adding Extension Research

1. Create `extension/docs/research/<topic>.md`.
2. Include source links and the checked date.
3. Separate verified facts from recommendations for this repository.

### Adding Extension Requirements

1. Add user-facing needs under `extension/docs/requirements/user/` when the
   requirement describes what users expect from the extension.
2. Add system-facing behavior under `extension/docs/requirements/functional/`
   when the requirement describes commands, settings, diagnostics, lifecycle,
   packaging, or integration behavior.
3. Link functional requirements back to user requirements when possible.
4. Add technical constraints under `extension/docs/requirements/technical/`
   when the requirement describes TypeScript, linting, packaging, build, or CI
   gates.

### Adding Extension BDD

1. Add shared-review behavior scenarios under `extension/docs/bdd/features/`.
2. Use terms from `extension/docs/ddd/ubiquitous-language.md`.
3. Link new scenarios to requirements in `extension/docs/bdd/traceability.md`.
4. Keep core lint-rule examples in root `docs/bdd/`; extension BDD should cover
   editor integration behavior.

### Adding Extension Tests

1. Add test strategy docs under `extension/docs/tests/`.
2. Keep runnable helper scripts under `extension/docs/tests/scripts/`.
3. Scripts must run from the repository root, avoid network access, and avoid
   modifying files.
4. Use planned skips for future extension source checks until source exists.

### Adding Extension Plans

1. Create phase plans under `extension/docs/plans/`.
2. Keep plans scoped to extension work.
3. Do not retroactively rewrite shipped plans. Add execution notes instead.

### Adding Extension ADRs

1. Create `extension/docs/adr/ADRxxx-<slug>.md` with the next sequential
   extension ADR number.
2. Add a row to `extension/docs/README.md`.
3. ADR decisions are append-only once accepted.

## Invariants

- Keep this tree about the VS Code extension. Core lint engine docs belong in
  root `docs/`.
- Do not place generated extension build artifacts here.
- Keep source evidence for research claims.
- Prefer stable markdown links over wiki-only links so GitHub rendering remains
  useful.
- Extension docs must pass `bun run test:dogfood:extension-docs` before commit.

## See Also

- [Extension Docs Index](README.md)
- [Root Docs](../../docs/README.md)
- [Root AGENTS.md](../../AGENTS.md)
- [Extension Research](research/index.md)
