# packages/

Workspace packages published from this monorepo.

## Package map

| Path | Published name | Purpose |
| --- | --- | --- |
| [`core/`](core/README.md) | `markdownlint-obsidian` | Programmatic linting engine, public API surface, built-in rule set |
| [`cli/`](cli/README.md) | `markdownlint-obsidian-cli` | Thin command-line wrapper around the core engine |

## Edit routing

- Change OFM rules, parsers, formatters, or the public API in
  [`core/`](core/README.md).
- Change CLI flags, exit handling, or argument-to-engine wiring in
  [`cli/`](cli/README.md).
- Change repository-wide publishing flow in [`../scripts/`](../scripts/README.md)
  and the root [`../AGENTS.md`](../AGENTS.md).

## Release flow

Publish from the package directory you are releasing, not from the workspace
root:

```bash
cd packages/core && npm publish
cd packages/cli && npm publish
```

Run [`../scripts/prepare-publish.mjs`](../scripts/prepare-publish.mjs) first so
workspace-local dependency ranges are rewritten to concrete semver values in the
published manifest.

## See also

- [`core/README.md`](core/README.md)
- [`cli/README.md`](cli/README.md)
- [`../README.md`](../README.md)
