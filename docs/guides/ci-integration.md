# CI integration guide

This guide covers the three supported ways to run `markdownlint-obsidian`
in CI: a GitHub Action, the `pre-commit` framework, and a Docker image.
Pick whichever matches your pipeline's existing style.

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
- `format` — one of `default`, `json`, `junit`, `sarif`.
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

## Docker

For pipelines that want a hermetic, Node-free runner:

```bash
docker run --rm -v "$(pwd):/workdir" \
  ghcr.io/alisonaquinas/markdownlint-obsidian:latest \
  "**/*.md"
```

Note: `:latest` floats to the newest release. For reproducible CI builds, pin to a specific tag (e.g., `:v0.8.0`) or digest. See the [Installation guide](./install.md#pinning-by-digest-recommended-for-reproducible-ci) for details.

The image is published to GitHub Container Registry on every release.
Tag both `latest` and the release tag (e.g. `v0.8.0`) so you can pin
versions in your pipeline.

### Verifying the image before use

Every release image is signed with [Sigstore cosign](https://github.com/sigstore/cosign).
Add this step before running the image in security-sensitive pipelines:

```yaml
- uses: sigstore/cosign-installer@v3

- name: Verify image signature
  run: |
    cosign verify \
      --certificate-identity-regexp '^https://github\.com/alisonaquinas/markdownlint-obsidian/' \
      --certificate-oidc-issuer https://token.actions.githubusercontent.com \
      ghcr.io/alisonaquinas/markdownlint-obsidian:latest
```

For reproducible CI, replace `:latest` with a digest pin. See the
[Installation guide](./install.md#pinning-by-digest-recommended-for-reproducible-ci) for details.

### GitLab CI example

```yaml
lint:markdown:
  image: ghcr.io/alisonaquinas/markdownlint-obsidian:latest
  script:
    - markdownlint-obsidian "**/*.md" --output-formatter junit > junit.xml
  artifacts:
    reports:
      junit: junit.xml
```

## Using Bun in CI

If your pipeline already has Bun, swap `setup-node` for `setup-bun` and use
`bun` throughout:

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: "1.1.30"
- run: bun add -d markdownlint-obsidian
- run: bunx markdownlint-obsidian-cli "**/*.md"
```

The published `dist/bin.mjs` carries a `#!/usr/bin/env node` shebang, which
Bun respects. `bunx markdownlint-obsidian-cli` works identically to
`npx markdownlint-obsidian-cli`.

Consumer pipelines that use Node are **not affected** — the existing
`npx markdownlint-obsidian-cli` invocation continues to work as before.

## Output formatters

Every formatter is available both from the CLI (`--output-formatter`)
and every wrapper above (`format:` input, etc.).

| Name      | When to use                                            |
| --------- | ------------------------------------------------------ |
| `default` | Human-readable `file:line:col CODE msg` lines.         |
| `json`    | Downstream tooling, custom reporters.                  |
| `junit`   | Jenkins, GitLab CI, Azure Pipelines test dashboards.   |
| `sarif`   | GitHub code scanning, SARIF viewers.                   |
