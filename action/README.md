# markdownlint-obsidian Action

A JavaScript GitHub Action that lints Obsidian Flavored Markdown with
[`markdownlint-obsidian`](https://github.com/alisonaquinas/markdownlint-obsidian).

## Usage

```yaml
- uses: alisonaquinas/markdownlint-obsidian/action@v0.8.0
  with:
    globs: "**/*.md"
    format: default
```

## Inputs

| Name               | Default     | Description                                           |
| ------------------ | ----------- | ----------------------------------------------------- |
| `globs`            | `**/*.md`   | Space-separated glob patterns to lint.                |
| `vault-root`       | _(auto)_    | Override auto-detected vault root.                    |
| `config`           | _(auto)_    | Explicit config file path.                            |
| `format`           | `default`   | Output formatter: `default`, `json`, `junit`, `sarif`. |
| `fail-on-warnings` | `false`     | Treat warnings as failures.                           |

## Outputs

| Name            | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `error-count`   | Total error count across all linted files.                 |
| `warning-count` | Total warning count across all linted files.               |
| `sarif-path`    | Path to the SARIF output file (when `format: sarif`).      |

## SARIF upload recipe

```yaml
- uses: alisonaquinas/markdownlint-obsidian/action@v0.8.0
  with:
    format: sarif
  id: lint
- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: ${{ steps.lint.outputs.sarif-path }}
```

## Building

This action ships a pre-built bundle at `dist/main.js`. To rebuild:

```bash
cd action
npm install
npm run build
```

CI enforces that `action/dist` is up to date via `git diff --exit-code`.

The live action metadata is stored in [`action.yml`](action.yml), so consumer
workflows must reference the subdirectory action path shown above.
