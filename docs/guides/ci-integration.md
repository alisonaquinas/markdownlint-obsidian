---
title: "CI integration guide"
aliases:
  - "CI integration guide"
tags:
  - "docs"
  - "docs/guides"
type: "guide"
status: "current"
updated: 2026-08-03
up: "[[README]]"
---

# CI integration guide

This guide covers the supported ways to run `markdownlint-obsidian`
in CI: a GitHub Action, the `pre-commit` framework, and npm/npx-based
invocations in other CI systems. Published artifacts are distributed through
npmjs.org using trusted publishing only.

## GitHub Action

Drop this step into any workflow:

```yaml
- uses: alisonaquinas/markdownlint-obsidian/action@v0.8.0
  with:
    globs: "**/*.md"
    format: default
```

Inputs:

- `globs` — space-separated glob patterns. Default: `**/*.md`.
- `vault-root` — override auto-detection.
- `config` — explicit config file path.
- `format` — one of `default`, `json`, `junit`, `sarif`, `codeclimate`, or
  `gitlab-code-quality`.
- `fail-on-warnings` — treat warnings as failures.

### SARIF + code scanning

```yaml
- uses: alisonaquinas/markdownlint-obsidian/action@v0.8.0
  id: lint
  with:
    format: sarif
- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: ${{ steps.lint.outputs.sarif-path }}
```

## pre-commit

Add `markdownlint-obsidian` to `.pre-commit-config.yaml`:

```yaml
- repo: https://github.com/alisonaquinas/markdownlint-obsidian
  rev: v0.8.0
  hooks:
    - id: markdownlint-obsidian
```

The hook runs the npm bin against every staged `*.md` file. Use
`pre-commit install` once per clone to enable it.

### GitLab CI example

```yaml
lint:markdown:
  image: node:20
  before_script:
    - npm install -g markdownlint-obsidian-cli
  script:
    - |
      report=gl-code-quality-report.json
      lint_status=0
      markdownlint-obsidian "**/*.md" --output-formatter codeclimate > "$report" || lint_status=$?
      node -e '
        const fs = require("node:fs");
        const path = require("node:path");
        const file = process.argv[1];
        const findings = JSON.parse(fs.readFileSync(file, "utf8"));
        for (const finding of findings) {
          finding.location.path = path
            .relative(process.cwd(), finding.location.path)
            .replaceAll("\\", "/");
        }
        fs.writeFileSync(file, JSON.stringify(findings, null, 2));
      ' "$report"
      exit "$lint_status"
  artifacts:
    reports:
      codequality: gl-code-quality-report.json
```

`gitlab-code-quality` is an alias for `codeclimate`. GitLab requires every
`location.path` to be repository-relative. The formatter converts backslashes
to `/` and strips a leading `./`, but preserves absolute paths because the
formatter API has no working-directory context. Core API callers should pass
relative `LintResult.filePath` values. Current CLI file discovery returns
absolute paths, so the example relativizes them before GitLab imports the
artifact. A formatter-context API remains follow-up work.

## Using Bun in CI

If your pipeline already has Bun, swap `setup-node` for `setup-bun` and use
`bun` throughout:

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: "1.1.30"
- run: bun add -d markdownlint-obsidian-cli
- run: bunx markdownlint-obsidian-cli "**/*.md"
```

The published `dist/bin.mjs` carries a `#!/usr/bin/env node` shebang, which
Bun respects. `bunx markdownlint-obsidian-cli` works identically to
`npx markdownlint-obsidian-cli`.

Consumer pipelines that use Node are **not affected** — the existing
`npx markdownlint-obsidian-cli` invocation continues to work as before.

## Line Endings

`markdownlint-obsidian` normalizes Markdown input before linting so equivalent
LF and CRLF files produce the same diagnostics. Still configure Git explicitly
so editors, diffs, CI checkouts, and other Markdown tools agree on the file
bytes in the working tree.

For Markdown-heavy repositories, add this to `.gitattributes`:

```gitattributes
*.md text eol=lf
```

Then normalize existing Markdown files once:

```bash
git add --renormalize '*.md'
git commit -m "Normalize Markdown line endings"
```

Use `.editorconfig` as the editor-side companion:

```editorconfig
[*.md]
end_of_line = lf
```

`.gitattributes` controls Git index and checkout normalization. `.editorconfig`
helps editors write the expected line endings before Git sees the file.

## Output formatters

Every formatter is available both from the CLI (`--output-formatter`)
and every wrapper above (`format:` input, etc.).

| Name                                  | When to use                                        |
| ------------------------------------- | -------------------------------------------------- |
| `default`                             | Human-readable `file:line:col CODE msg` lines.     |
| `json`                                | Downstream tooling, custom reporters.              |
| `junit`                               | CI test dashboards.                                |
| `sarif`                               | GitHub code scanning, SARIF viewers.               |
| `codeclimate` / `gitlab-code-quality` | GitLab Code Quality report artifacts.              |
