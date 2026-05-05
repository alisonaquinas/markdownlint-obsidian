# AGENTS.md - Guide for AI Agents Working in `extension/docs/`

Documentation tree for the planned `markdownlint-obsidian` VS Code extension.
This directory is not extension source code. It is the planning and reference
wiki for extension behavior, architecture, requirements, release decisions, and
research.

## Layout

```text
extension/docs/
├── README.md              # index of this extension documentation tree
├── AGENTS.md              # this file
├── architecture/          # extension architecture and data-flow notes
├── ddd/                   # extension bounded contexts and ubiquitous language
├── requirements/          # user and functional requirements
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
- Extension docs should pass the repo markdown lint rules before commit.

## See Also

- [Extension Docs Index](README.md)
- [Root Docs](../../docs/README.md)
- [Root AGENTS.md](../../AGENTS.md)
- [Extension Research](research/index.md)
