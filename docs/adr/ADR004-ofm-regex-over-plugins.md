# ADR004 — Use regex extractors for OFM syntax instead of markdown-it plugins

**Status:** Accepted
**Date:** 2026-04-11
**Context phase:** Phase 2 (parser pipeline)

## Context

The design spec lists `markdown-it-wikilinks`, `markdown-it-obsidian-tags`,
`markdown-it-callout`, `markdown-it-highlight`, and `markdown-it-comment` as
plugins that produce ParseResult content. These plugins are partially
unmaintained, carry inconsistent type definitions, and emit token shapes that
would leak into every rule's implementation. Phase 7 requires markdown-it for
standard-md rule integration — we cannot drop markdown-it entirely.

## Decision

Use `markdown-it` core (no OFM plugins) for CommonMark tokens. Implement OFM
syntax extraction as a set of deterministic line-oriented scanners under
`infrastructure/parser/ofm/`. Every scanner takes the raw file as a
`readonly string[]` (one entry per line) plus a `CodeRegionMap` (precomputed
set of lines/columns that are inside fenced or inline code and must be
skipped) and returns a `readonly Node[]` of the appropriate domain type.

## Consequences

- **Pro:** Deterministic output; trivially unit-testable against string
  fixtures; no plugin version drift; code/math exclusion handled once for all
  node types.
- **Pro:** The public `ParseResult` contract is unchanged. Rules remain
  unaware of the extraction mechanism.
- **Con:** Any future OFM syntax addition requires a new extractor instead
  of adding a plugin. Acceptable — Obsidian's OFM syntax evolves slowly.
- **Con:** We cannot piggy-back on plugin-provided sourcemap tokens for the
  affected node types. We synthesize `SourcePosition` from regex match
  offsets instead.

## Related

- [[roadmap]]
- [[plans/phase-02-parser]]
- [[superpowers/specs/2026-04-11-markdownlint-obsidian-design]]
