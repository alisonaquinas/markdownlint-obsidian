# scripts/

Repo-level maintenance scripts. These run at build time or during publishing;
they are not part of the shipped npm packages.

## Scripts

| Script | When it runs | Purpose |
| :--- | :--- | :--- |
| `prepare-publish.mjs` | Manual, before `npm publish` | Rewrites `workspace:*` deps to real semver ranges in the package's `dist/package.json` so npm consumers get pinned versions rather than workspace-local references |

## Adding a script

1. Create the script file in this directory (`scripts/<name>.mjs` or `.ts`).
2. Add it to the relevant `scripts` field in the affected `package.json`.
3. Document it in the table above.

## Notes

- Scripts here are run by Bun (`.mjs`) or via `bun run <script>` in a
  package workspace. Do not use CommonJS `require()` — use ESM `import`.
- `prepare-publish.mjs` must be run before any `npm publish` from
  `packages/core` or `packages/cli`. The root `prepublishOnly` guard
  prevents accidental publishing from the workspace root.
