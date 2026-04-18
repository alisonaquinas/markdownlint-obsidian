# AGENTS.md — Guide for AI Agents Working in `action/`

GitHub Action wrapper for `markdownlint-obsidian-cli`. Ships a pre-built
esbuild bundle at `dist/main.js`. Contains no linting logic — delegates
everything to the CLI package.

## Layout

```text
action/
├── src/
│   └── main.ts          # action entry: reads inputs, invokes CLI, sets outputs
├── dist/
│   └── main.js          # pre-built esbuild bundle — must be committed
├── node_modules/        # action-local deps (not in workspace root node_modules)
├── AGENTS.md            # this file
├── CLAUDE.md
└── package.json         # standalone (not a Bun workspace package)
```

## Workflows

### Rebuilding the bundle

```bash
cd action
npm install
npm run build
git add dist/main.js
```

CI runs `git diff --exit-code action/dist/` and fails if the bundle is
out of date. Always rebuild and commit after editing `src/main.ts` or
updating action dependencies.

### Adding an input

1. Declare the input in `../action.yml`.
2. Read it with `core.getInput('<name>')` in `src/main.ts`.
3. Pass it as a CLI flag to the spawned process.
4. Document it in `action/README.md`.

### Adding an output

1. Declare the output in `../action.yml`.
2. Set it with `core.setOutput('<name>', value)` in `src/main.ts`.
3. Document it in `action/README.md`.

## Invariants — Do Not Violate

- `dist/main.js` is a committed build artifact. Never edit it by hand.
  Rebuild with `npm run build` inside `action/`.
- `action/` uses its own `package.json` and `node_modules/`. Do not add
  action dependencies to the workspace root.
- This package must not depend on `packages/core` or `packages/cli` source
  directly — it depends on the published npm release of
  `markdownlint-obsidian-cli`.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [action/README.md](README.md)
- [packages/cli AGENTS.md](../packages/cli/AGENTS.md)
