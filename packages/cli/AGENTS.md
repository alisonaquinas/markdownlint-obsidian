# AGENTS.md — Guide for AI Agents Working in `packages/cli`

Thin `commander`-based CLI wrapper around `markdownlint-obsidian`. Contains no
linting logic — all business behavior lives in `packages/core`. Publishes the
`markdownlint-obsidian` binary.

## Layout

```text
packages/cli/
├── src/
│   ├── args.ts    # buildProgram() — defines CLI flags and returns parsed CLIArgs
│   └── main.ts    # entry point: parse args → call engine → format → exit
├── bin/
│   └── bin/       # entry shim (Node-compatible shebang pointing at dist/bin.mjs)
├── dist/          # build output — not committed
├── scripts/
│   └── gen-dist-bin.mjs   # post-build: produces dist/bin.mjs with Node shebang
├── tests/
│   └── integration/       # CLI invocation tests using bun test
├── AGENTS.md      # this file
├── CLAUDE.md
└── package.json
```

## Workflows

### Adding a CLI flag

1. Add the flag to `buildProgram()` in `src/args.ts` and extend `CLIArgs`.
2. Thread the new value through `src/main.ts` into the engine call.
3. Update `packages/cli/README.md` with the new flag and its description.
4. Add or extend an integration test in `tests/integration/`.

### Running tests

```bash
bun test
bun test --watch
```

### Building

```bash
bun run build
```

Runs `tsc` then `scripts/gen-dist-bin.mjs` to produce `dist/bin.mjs`.

## Invariants — Do Not Violate

- `src/` must contain only argument parsing and process orchestration.
  No linting logic, no rule code, no formatter code belongs here.
- Exit code semantics are fixed: `0` = clean, `1` = lint errors found,
  `2` = tool/config failure. Do not add new exit codes without updating
  `packages/cli/README.md`.
- `dist/` is gitignored and must never be committed from this package.
  (Contrast: `action/dist/` is committed — different package, different rule.)

## See Also

- [Root AGENTS.md](../../AGENTS.md)
- [packages/core AGENTS.md](../core/AGENTS.md)
- [CONCEPTS.md](../../CONCEPTS.md)
