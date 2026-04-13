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

## Usage

```bash
# Lint all markdown files
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

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Clean (no errors; warnings do not raise exit code) |
| `1` | One or more lint errors found |
| `2` | Tool or configuration failure |

## License

MIT
