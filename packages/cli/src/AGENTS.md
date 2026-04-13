# AGENTS.md — Guide for AI Agents Working in `packages/cli/src`

Entry point and argument definition for the `markdownlint-obsidian` CLI.
Two files only — keep this layer thin.

## Layout

```text
src/
├── args.ts   # buildProgram() — commander Command + CLIArgs interface
└── main.ts   # process entry: parse → engine → format → exit
```

## Workflows

### Adding a flag

1. Add the `commander` option to `buildProgram()` in `args.ts`.
2. Extend `CLIArgs` with the new field.
3. Read the value in `main.ts` and pass it to the engine call.
4. Update `packages/cli/README.md`.

### Changing exit codes

Exit codes are set explicitly in `main.ts`. The contract is:

| Code | Meaning |
| --- | --- |
| `0` | Clean run (no errors; warnings do not raise exit code) |
| `1` | One or more lint errors found |
| `2` | Tool or configuration failure |

Changing this contract is a breaking change — bump the CLI major version.

## Invariants — Do Not Violate

- No linting logic here. All rule, parse, and format logic lives in
  `packages/core`.
- `CLIArgs` fields must be `readonly`.
- `main.ts` must call `process.exit()` explicitly; do not let unhandled
  errors propagate to Node.js's default non-zero exit.

## See Also

- [packages/cli AGENTS.md](../AGENTS.md)
- [Root AGENTS.md](../../../AGENTS.md)
