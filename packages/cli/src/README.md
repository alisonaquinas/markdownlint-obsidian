# packages/cli/src

Thin source layer for the `markdownlint-obsidian-cli` package.

## Files

| File | Responsibility |
| --- | --- |
| [`args.ts`](args.ts) | Defines the commander program and supported flag schema |
| [`main.ts`](main.ts) | Parses arguments, calls the core engine, formats output, and returns exit codes |

## Edit routing

- Change the user-facing CLI surface in `args.ts`.
- Change option handling, output emission, or exit behavior in `main.ts`.
- Keep all linting behavior in `../../core/`; this package should only
  orchestrate process-level concerns.

## See also

- [`../README.md`](../README.md)
- [`AGENTS.md`](AGENTS.md)
