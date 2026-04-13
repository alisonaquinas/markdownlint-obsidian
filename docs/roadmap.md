# Roadmap

Central phase plan index for `markdownlint-obsidian`. Each phase produces working, testable software on its own. Implementation plans live in `[[docs/plans/]]`.

## Phases

| Phase | Plan                                     | Scope                                                                                                                                         | Status   |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1     | [[plans/phase-01-scaffold]]              | Project scaffold: TypeScript build, ESLint, Prettier, Vitest, BDD harness, CLI stub, file discovery, config loader, default + JSON formatters | Planned  |
| 2     | [[plans/phase-02-parser]]                | Parser pipeline: markdown-it + OFM plugins, ParseResult domain types, first BDD scenario wired end-to-end                                     | Planned  |
| 3     | [[plans/phase-03-frontmatter-tags]]      | Frontmatter rules OFM080–099, tag rules OFM060–079                                                                                            | Planned  |
| 4     | [[plans/phase-04-wikilinks]]             | Wikilink rules OFM001–019, vault index, wikilink resolution, vault-detection BDD feature                                                      | Planned  |
| 5     | [[plans/phase-05-embeds-callouts]]       | Embed rules OFM020–039, callout rules OFM040–059                                                                                              | Planned  |
| 6     | [[plans/phase-06-block-refs-highlights]] | Block reference rules OFM100–119, highlight/comment rules OFM120–139                                                                          | Planned  |
| 7     | [[plans/phase-07-standard-md]]           | markdownlint MD001–MD049 integration, OFM-conflicting rules documented and disabled by default                                                | Planned  |
| 8     | [[plans/phase-08-ci-delivery]]           | JUnit + SARIF formatters, GitHub Action, pre-commit hook, Docker image                                                                        | Planned  |
| 9     | [[plans/phase-09-autofix]]               | Auto-fix support for fixable rules (`--fix` flag fully wired)                                                                                 | Planned  |
| 10    | [[plans/phase-10-custom-rules]]          | Custom rules API, documentation, and worked examples                                                                                          | Planned  |
| 11    | [[plans/phase-11-bun-migration]]         | Adopt Bun as primary dev/test/CI runtime; preserve Node for published consumers                                                               | Complete |
| 12    | [[plans/phase-12-cd-automation]]         | Full CD via release-please; npm publish, action-tag, docker-publish fan-out                                                                   | Complete |
| 13    | [[plans/phase-13-package-split]]         | Split into `markdownlint-obsidian` (library) + `markdownlint-obsidian-cli` (CLI) as Bun workspace monorepo                                    | Complete |
| 14    | [[plans/phase-14-multi-registry-cd]]     | Multi-registry publishing (npmjs.org, GitHub Packages, ghcr.io) + supply-chain hardening (provenance, cosign, SBOM)                           | Planned  |

## Architecture Decision Records

- [[adr/ADR001-option-b-standalone]] — Standalone CLI (Option B) chosen over plugin or layered approach
- [[adr/ADR002-wikilink-resolution-default-on]] — Wikilink resolution on by default, opt-out via `--no-resolve`
- [[adr/ADR003-markdownlint-as-dependency]] — Import `markdownlint` library for MD001–MD049 rules

## Design Layers

- [[ddd/ubiquitous-language]] — Canonical glossary; all code defers to these terms
- [[ddd/bounded-contexts]] — Context map: linting / vault / config
- `docs/bdd/features/` — Gherkin feature files; source of truth for observable CLI behaviour
