# markdownlint-obsidian-cli

Command-line interface for linting Obsidian Flavored Markdown. Wraps the
`markdownlint-obsidian` library with a `commander`-based CLI.

## Install

```bash
# Global install
npm install -g markdownlint-obsidian-cli
bun add -g markdownlint-obsidian-cli

# Project install (use via npx / bunx)
npm install -D markdownlint-obsidian-cli
```

Consumers can run the published CLI under Node.js 20+ or Bun 1.1+.

## Usage

```bash
# One-off run without installing globally
npx markdownlint-obsidian-cli "**/*.md"

# After a global or local install, invoke the published binary directly
markdownlint-obsidian "**/*.md"

# Fix auto-fixable issues in place
markdownlint-obsidian --fix "**/*.md"

# Check what would be fixed (no writes)
markdownlint-obsidian --fix-check "**/*.md"

# Machine-readable output
markdownlint-obsidian --output-formatter sarif "**/*.md" > report.sarif
markdownlint-obsidian --output-formatter junit "**/*.md" > junit.xml

# Custom config location
markdownlint-obsidian --config /path/to/project "**/*.md"
```

## Supported runtime flags

| Flag | Description |
| --- | --- |
| `--config <path>` | Load `.obsidian-linter.jsonc` from an explicit directory or file path |
| `--fix` | Apply auto-fixable edits in place |
| `--fix-check` | Dry-run fix mode; report what would change without writing |
| `--vault-root <path>` | Override auto-detected vault root |
| `--no-resolve` | Disable vault-wide wikilink and embed resolution |
| `--output-formatter <name>` | Select `default`, `json`, `junit`, or `sarif` output |

If you omit glob arguments, the CLI falls back to the configured `globs`
property from `.obsidian-linter.jsonc`.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Clean (no errors; warnings do not raise exit code) |
| `1` | One or more lint errors found |
| `2` | Tool or configuration failure |

## Developing in this monorepo

```bash
bun install
cd packages/cli
bun test
bun run build
```

See [`src/README.md`](src/README.md) for the thin wrapper layout and
[`../../docs/guides/ci-integration.md`](../../docs/guides/ci-integration.md)
for pipeline recipes.

## License

MIT
