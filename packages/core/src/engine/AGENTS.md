# AGENTS.md — Guide for AI Agents Working in `packages/core/src/engine`

DI root for the linting engine. Wires every infrastructure adapter and domain
service into the full execution graph so callers never touch factories directly.
This is the only layer that may instantiate concrete infrastructure types.

## Layout

```text
src/engine/
└── index.ts   # exports lint(), fix(), loadConfig(), getFormatter()
```

## Exported API

| Export | Description |
| --- | --- |
| `lint(options)` | Discover files, parse, run rules, return `LintResult[]` |
| `fix(options)` | Run lint, apply fixes in place, return `FixOutcome` |
| `loadConfig(cwd)` | Load and validate `.obsidian-linter.jsonc` from `cwd` |
| `getFormatter(name)` | Return the named `LintResult[] → string` formatter |

## Workflows

### Changing the wiring

Edit `index.ts`. The construction order is:

1. Load `LinterConfig` via `ConfigLoader`.
2. Load custom rules via `CustomRuleLoader` if configured.
3. Build a `RuleRegistry` and register built-in + custom rules.
4. If `config.resolve === true`: bootstrap vault (detect root, build indexes).
5. Discover files via `FileDiscovery`.
6. Run `LintUseCase` or `FixUseCase` with all adapters injected.

## Invariants — Do Not Violate

- `engine/index.ts` is the only file permitted to `new` concrete
  infrastructure types. All other layers receive interfaces.
- Public exports must satisfy DIP: callers depend on plain interfaces and
  domain VOs only — never on infrastructure concrete classes.
- `getFormatter` must throw a clear error if the requested name is not
  registered, rather than returning `undefined`.

## See Also

- [packages/core AGENTS.md](../../AGENTS.md)
- [src/application AGENTS.md](../application/AGENTS.md)
- [src/infrastructure AGENTS.md](../infrastructure/AGENTS.md)
- [Root AGENTS.md](../../../../AGENTS.md)
