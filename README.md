# markdownlint-obsidian

Obsidian Flavored Markdown linter for CI pipelines. Catches broken
wikilinks, unresolved embeds, malformed callouts, block-reference typos,
and every standard `markdownlint` rule — with OFM-aware rule conflicts
pre-wired.

## Install

```bash
# npm (Node 20+)
npm install -D markdownlint-obsidian

# bun (Bun 1.1+)
bun add -d markdownlint-obsidian
```

Consumers: Node 20+ or Bun 1.1+ supported.

## Development

markdownlint-obsidian uses [Bun](https://bun.sh) 1.1+ for development and CI.
Consumers can install and run the package under Node.js 20+ or Bun 1.1+.

```bash
curl -fsSL https://bun.sh/install | bash  # or: npm install -g bun
bun install
bun run test:all
```

## Quick start

```bash
# Lint every markdown file under the current directory.
npx markdownlint-obsidian "**/*.md"

# Machine-readable output for CI dashboards.
npx markdownlint-obsidian --output-formatter junit "**/*.md" > junit.xml
npx markdownlint-obsidian --output-formatter sarif "**/*.md" > report.sarif
```

The CLI auto-detects the Obsidian vault root by walking up from the
first argument looking for a `.obsidian` directory. Override with
`--vault-root <path>` or drop a `.obsidian-linter.jsonc` config at the
project root.

### Minimal config

```jsonc
// .obsidian-linter.jsonc
{
  "vaultRoot": "./",
  "resolve": true,
  "globs": ["**/*.md"],
  "ignores": ["node_modules/**"],
  "rules": {
    "MD013": { "enabled": false }
  }
}
```

## CI examples

### GitHub Actions

```yaml
- uses: alisonaquinas/markdownlint-obsidian@v0.8.0
  with:
    globs: "**/*.md"
    format: sarif
  id: lint
- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: ${{ steps.lint.outputs.sarif-path }}
```

### pre-commit

```yaml
# .pre-commit-config.yaml
- repo: https://github.com/alisonaquinas/markdownlint-obsidian
  rev: v0.8.0
  hooks:
    - id: markdownlint-obsidian
```

### Docker

```bash
docker run --rm -v "$(pwd):/workdir" \
  ghcr.io/alisonaquinas/markdownlint-obsidian:latest \
  "**/*.md"
```

See [`docs/guides/ci-integration.md`](docs/guides/ci-integration.md)
for GitLab CI, Jenkins, and Azure Pipelines recipes.

## Output formatters

| Name      | When to use                                              |
| --------- | -------------------------------------------------------- |
| `default` | Human-readable `file:line:col CODE message` lines.       |
| `json`    | Downstream tooling and custom reporters.                 |
| `junit`   | Jenkins, GitLab CI, Azure Pipelines test dashboards.     |
| `sarif`   | GitHub code scanning, SARIF viewers.                     |

## Documentation

- [`docs/roadmap.md`](docs/roadmap.md) — phased delivery plan.
- [`docs/rules/`](docs/rules) — per-rule catalog (OFM + standard MD).
- [`docs/guides/ci-integration.md`](docs/guides/ci-integration.md) — CI
  integration cookbook.
- [`CHANGELOG.md`](CHANGELOG.md) — release history.

## License

MIT
