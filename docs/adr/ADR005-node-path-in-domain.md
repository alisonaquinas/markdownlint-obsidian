# ADR005 — Allow `node:path` in domain value objects

**Status:** Accepted
**Date:** 2026-04-11
**Context phase:** Phase 4 → Phase 5 transition

## Context

The design spec's Architecture Policy (section "Low Coupling") states:

> Domain never imports infrastructure (`fs`, `path`, `markdown-it`).

Phase 4 introduced `VaultPath` and `VaultRoot` under `src/domain/vault/`. Both value objects normalise string paths — converting vault-relative forms, resolving absolute paths, splitting filenames into `(stem, extension)`. The Phase 4 plan imports `node:path` at the top of each VO. The Phase 4 reviewer flagged this as a spec conflict.

There are two reasonable resolutions:

1. **Amend the spec** to permit `node:path` in domain VOs that need string path manipulation. Matches how most TypeScript DDD codebases treat `node:path`.
2. **Move path normalisation to a factory at the infrastructure boundary** (e.g. have `FileIndexBuilder` resolve absolutes before calling `makeVaultPath`). Stricter, but trades safety for ceremony.

## Decision

Adopt option 1. `node:path` is allowed in `src/domain/**` whenever its use is:

- **Pure** — no filesystem access, no process state, no side effects
- **String-only** — operates on path strings, not on real filesystem entries
- **Platform-abstraction** — joins/splits/normalises without caring whether the resulting path exists

The forbidden-imports list in the spec becomes `fs`, `fs/promises`, `markdown-it`, `gray-matter`, `globby`, `commander`, and any npm package with IO or framework semantics. `node:path` is excluded from the ban.

`node:url`, `node:querystring`, and other pure-string stdlib modules are implicitly allowed under the same rationale. `node:fs`, `node:child_process`, `node:net`, and `node:http` remain forbidden.

## Consequences

- **Pro:** `VaultPath` / `VaultRoot` can own path normalisation logic. The alternative (pushing normalisation into infrastructure) leaks format knowledge into adapter code that should be concerned with IO, not shape.
- **Pro:** Tests stay pure — VO construction never touches disk.
- **Pro:** Matches industry practice. Treating `node:path` as "infrastructure" is a heuristic the community has largely abandoned.
- **Con:** Slight weakening of the "domain has zero Node-specific imports" story. Mitigated by the `pure / string-only / platform-abstraction` qualifier.
- **Con:** Future reviewers must understand this ADR. Mitigated by referencing it from the spec.

## Action items

1. Update `docs/superpowers/specs/2026-04-11-markdownlint-obsidian-design.md` section "Low Coupling" to reference this ADR and replace the ban on `path` with the pure-stdlib allowlist.
2. No code changes. Phase 4's `VaultPath` and `VaultRoot` remain as-is.
3. Phase 5+ reviewers should treat `node:path` imports in domain VOs as acceptable.

## Related

- [[plans/phase-04-wikilinks]]
- [[superpowers/specs/2026-04-11-markdownlint-obsidian-design]]
- [[adr/ADR004-ofm-regex-over-plugins]]
