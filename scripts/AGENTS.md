# AGENTS.md — Guide for AI Agents Working in `scripts/`

Repository-level maintenance scripts. These are not published as part of the
npm packages; they support release and packaging workflows for the monorepo.

## Layout

```text
scripts/
├── prepare-publish.mjs   # rewrite workspace deps to real semver before npm publish
└── README.md             # human-facing usage notes
```

## Workflows

### Publishing a package

1. Run `node scripts/prepare-publish.mjs <pkg-dir> [scope]`.
2. Confirm the package-local `package.json` now contains concrete dependency
   ranges instead of `workspace:*`.
3. Publish from `packages/core` or `packages/cli`, not from the workspace root.

## Invariants — Do Not Violate

- Keep scripts ESM-based; do not switch them back to CommonJS.
- Scripts here should support packaging and repo maintenance only, not runtime
  lint behavior.
- Do not mutate the wrong package manifest. `prepare-publish.mjs` should only
  touch the package directory passed on the command line.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [scripts/README.md](README.md)
