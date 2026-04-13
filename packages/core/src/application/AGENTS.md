# AGENTS.md — Guide for AI Agents Working in `packages/core/src/application`

Application layer: orchestrates domain objects and infrastructure adapters to
execute the two primary use cases (lint and fix) and the vault bootstrap
procedure. Contains no business logic — only coordination.

## Layout

```text
src/application/
├── LintUseCase.ts    # orchestrates file discovery → parse → rule run → collect results
├── FixUseCase.ts     # orchestrates lint → collect fixes → apply → write files
└── VaultBootstrap.ts # detects vault root, builds VaultIndex and BlockRefIndex
```

## Workflows

### Modifying the lint pipeline

Edit `LintUseCase.ts`. The standard execution order is:

1. Receive `LinterConfig` and a list of discovered file paths.
2. For each file: read → parse → run registered rules → collect `LintError[]`.
3. Return one `LintResult` per file.

Rule execution is `await`-ed so async rules (those that do I/O via `fsCheck`)
are handled transparently.

### Modifying the fix pipeline

Edit `FixUseCase.ts`. After lint, fixes are:

1. Collected from `LintError.fix` fields.
2. Conflict-checked via `domain/fix/applyFixes.ts`.
3. Applied in a single write per file.

### Vault bootstrap changes

Edit `VaultBootstrap.ts` when changing how the vault root is detected or how
the index is populated. The vault bootstrap runs before the lint loop and
passes `VaultIndex` and `BlockRefIndex` through `RuleParams`.

## Invariants — Do Not Violate

- Application layer may import from `domain/` and depend on infrastructure
  interfaces, but must not import concrete infrastructure implementations
  directly — they are injected by `engine/index.ts`.
- `VaultBootstrap` must not be called when `config.resolve === false`.
  The engine guards on this flag before calling bootstrap.
- `LintUseCase` must `await` every rule's `run()` return value, including
  `undefined` (sync rules), to keep async rules first-class.

## See Also

- [packages/core AGENTS.md](../../AGENTS.md)
- [src/domain AGENTS.md](../domain/AGENTS.md)
- [src/infrastructure AGENTS.md](../infrastructure/AGENTS.md)
- [Root AGENTS.md](../../../../AGENTS.md)
