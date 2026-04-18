# AGENTS.md — Guide for AI Agents Working in `packages/core/src`

Implementation tree for the `markdownlint-obsidian` library package. This is
where the DDD layers, parser stack, built-in rules, and public entrypoints are
wired together.

## Layout

```text
src/
├── domain/          # pure contracts and value objects
├── application/     # lint/fix orchestration
├── infrastructure/  # adapters, parsers, rules, formatters, config, vault I/O
├── engine/          # DI root and top-level entrypoints
└── public/          # published API barrels
```

## Workflows

### Choosing the correct layer

1. Put pure types, rule contracts, and deterministic algorithms in `domain/`.
2. Put use-case sequencing in `application/`.
3. Put Node.js and library adapters in `infrastructure/`.
4. Put concrete object construction in `engine/`.
5. Put only intentionally published exports in `public/`.

### Adding a user-facing capability

1. Add or update domain contracts first.
2. Implement adapters or rules in `infrastructure/`.
3. Thread the behavior through `application/` and `engine/`.
4. Expose only the supported public surface from `public/`.
5. Update rule or guide docs alongside the code change.

## Invariants — Do Not Violate

- Import flow stays inward: `domain` must not import from `application`,
  `infrastructure`, or `engine`.
- `engine` is the only layer allowed to instantiate concrete infrastructure
  types directly.
- `public/` is semver-significant. Do not add or remove exports casually.

## See Also

- [packages/core AGENTS.md](../AGENTS.md)
- [src/domain AGENTS.md](domain/AGENTS.md)
- [src/application AGENTS.md](application/AGENTS.md)
- [src/infrastructure AGENTS.md](infrastructure/AGENTS.md)
- [Root AGENTS.md](../../../AGENTS.md)
