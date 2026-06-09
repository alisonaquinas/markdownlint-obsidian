# AGENTS.md — Guide for AI Agents Working in `action/`

GitHub Action wrapper for `markdownlint-obsidian-cli`. Ships a pre-built
esbuild bundle at `dist/main.mjs`. Contains no linting logic — delegates
everything to the npm-distributed CLI through `npx`.

## Layout

```text
action/
├── src/
│   └── main.ts          # action entry: reads inputs, invokes CLI, sets outputs
├── dist/
│   └── main.mjs         # pre-built esbuild bundle — must be committed
├── node_modules/        # action-local deps (not in workspace root node_modules)
├── AGENTS.md            # this file
├── CLAUDE.md
└── package.json         # standalone (not a Bun workspace package)
```

## Workflows

### Rebuilding the bundle

```bash
cd action
npm install --workspaces=false
npm run build
git add dist/main.mjs
```

CI rebuilds the bundle and runs an action smoke test. Always rebuild and
commit after editing `src/main.ts` or updating action dependencies.

### Adding an input

1. Declare the input in `action.yml`.
2. Read it with `core.getInput('<name>')` in `src/main.ts`.
3. Pass it as a CLI flag to the spawned process.
4. Document it in `action/README.md`.

### Adding an output

1. Declare the output in `action.yml`.
2. Set it with `core.setOutput('<name>', value)` in `src/main.ts`.
3. Document it in `action/README.md`.

## Invariants — Do Not Violate

- `dist/main.mjs` is a committed build artifact. Never edit it by hand.
  Rebuild with `npm run build` inside `action/`.
- `action/` uses its own `package.json` and `node_modules/`. Do not add
  action dependencies to the workspace root.
- This package must not depend on `packages/core` or `packages/cli` source
  directly — it invokes the npm-distributed `markdownlint-obsidian-cli`
  through `npx`.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [action/README.md](README.md)
- [packages/cli AGENTS.md](../packages/cli/AGENTS.md)
