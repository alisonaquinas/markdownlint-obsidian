# AGENTS.md — Guide for AI Agents Working in `scripts/`

Repository-level maintenance scripts. These are not published as part of the
npm packages; they support release and packaging workflows for the monorepo.

## Layout

```text
scripts/
├── prepare-publish.mjs   # rewrite workspace deps to real semver before packaging
└── README.md             # human-facing usage notes
```

## Workflows

### Publishing a package

1. Cut the package tag that matches the package version.
2. Let the release or dry-run workflow run
   `node scripts/prepare-publish.mjs <pkg-dir>`.
3. Confirm the package-local `package.json` now contains concrete dependency
   ranges instead of `workspace:*`.
4. Keep the publish step in GitHub Actions so npm trusted publishing can use
   OIDC and npm can generate provenance automatically.

Do not add registry tokens, `NODE_AUTH_TOKEN`, GitHub Packages npm publishing,
GHCR package/image publishing, or manual package-root `npm publish` release
steps.

## Invariants — Do Not Violate

- Keep scripts ESM-based; do not switch them back to CommonJS.
- Scripts here should support packaging and repo maintenance only, not runtime
  lint behavior.
- Do not mutate the wrong package manifest. `prepare-publish.mjs` should only
  touch the package directory passed on the command line.
- Packaging support must preserve tokenless publishing: OIDC trusted publishing
  only, never registry auth tokens.

## See Also

- [Root AGENTS.md](../AGENTS.md)
- [scripts/README.md](README.md)
