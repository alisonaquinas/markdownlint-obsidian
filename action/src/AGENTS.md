# AGENTS.md — Guide for AI Agents Working in `action/src`

Single-file source tree for the GitHub Action wrapper. This layer adapts
GitHub Action inputs and outputs to the published CLI package.

## Layout

```text
src/
└── main.ts   # reads inputs, invokes CLI, sets outputs
```

## Workflows

### Adding or changing an input

1. Update [`../action.yml`](../action.yml).
2. Read the input in `main.ts` with `@actions/core`.
3. Pass the value through to the CLI invocation.
4. Rebuild `../dist/main.js` and update [`../README.md`](../README.md).

### Adding or changing an output

1. Update [`../action.yml`](../action.yml).
2. Set the output in `main.ts`.
3. Document the change in [`../README.md`](../README.md).

## Invariants — Do Not Violate

- Keep linting logic out of this layer. It delegates to the CLI package.
- Never hand-edit `../dist/main.js`; rebuild it from `main.ts`.
- Keep the manifest path accurate in docs: the live action metadata is
  `action/action.yml`, not a root-level `action.yml`.

## See Also

- [action AGENTS.md](../AGENTS.md)
- [Root AGENTS.md](../../AGENTS.md)
