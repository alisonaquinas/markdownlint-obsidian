---
title: "vscode-markdownlint Technical Stack Research"
aliases:
  - "vscode-markdownlint Technical Stack Research"
tags:
  - "research/vscode"
  - "research/extension"
  - "research/markdownlint"
  - "docs"
  - "docs/research"
  - "docs/research/vscode-markdownlint"
type: "research"
status: "current"
updated: 2026-05-04
up: "[[README]]"
sources:
  - https://github.com/DavidAnson/vscode-markdownlint
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/package.json
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/extension.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/webpack.config.js
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/jsconfig.json
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/.github/workflows/ci.yml
---

# vscode-markdownlint Technical Stack

## Scope

This note captures the technical stack of David Anson's `vscode-markdownlint`
extension as a reference point for a Flavor Grenade companion VS Code extension.
The goal is not to copy the upstream architecture. Flavor Grenade should mirror
this repository's TypeScript/LSP stack where possible, while borrowing proven
VS Code extension packaging and contribution patterns.

Source snapshot: upstream `main`, package version `0.61.2`, checked on
2026-05-04.

## Stack Summary

| Area | Upstream choice |
|---|---|
| Extension name | `vscode-markdownlint`, display name `markdownlint` |
| Publisher | `DavidAnson` |
| Runtime target | VS Code extension host, with desktop and web bundles |
| VS Code engine | `^1.97.0` |
| Language | JavaScript ESM with `// @ts-check` |
| Type checking | `jsconfig.json` with `checkJs: true`, `module: NodeNext`, `target: es2017` |
| Package manager | npm |
| Core lint engine | `markdownlint-cli2@0.20.0` |
| Build tool | webpack 5 plus Terser |
| Desktop entry | `main: ./bundle.js` |
| Web entry | `browser: ./bundle.web.js` |
| Activation | `onLanguage:markdown` |
| Test runner | Node's built-in test runner plus VS Code UI tests; `test-web` is defined but not run by CI |
| CI | GitHub Actions on Ubuntu with `npm test` and Xvfb-backed UI tests |
| Packaging helper | `@vscode/vsce` dev dependency |

## Architecture

The extension is a direct VS Code extension, not an LSP client.

`extension.mjs` imports the VS Code API and `markdownlint-cli2` directly. It
creates a diagnostic collection, reads VS Code configuration, lints Markdown
documents in-process, and registers VS Code providers and commands. There is no
separate language server process, no `vscode-languageclient`, and no JSON-RPC
transport boundary.

Important integration points:

- Diagnostics: owns a VS Code `DiagnosticCollection`.
- Code actions: registers quick fixes and source fix-all actions.
- Formatting: registers a document range formatting provider.
- Commands: `markdownlint.fixAll`, `markdownlint.lintWorkspace`,
  `markdownlint.openConfigFile`, and `markdownlint.toggleLinting`.
- Workspace linting: exposes a VS Code task and pseudoterminal for linting all
  Markdown files.
- Configuration: contributes `markdownlint.*` settings with resource or
  application scope.
- Schemas: contributes JSON and YAML validation for `.markdownlint.*` and
  `.markdownlint-cli2.*` config files.
- Snippets: contributes Markdown snippets.

## Build And Bundling

Upstream builds two bundles from the same `extension.mjs` entry:

- `bundle.js` targets Node and is used by desktop VS Code.
- `bundle.web.js` targets `webworker` and is used by browser/web VS Code.

The webpack config keeps `vscode` external, rewrites `node:` imports for
compatibility, and provides web fallbacks or stubs for Node modules that are not
available in the browser. Web support is real, but it requires explicit shims:
`path-browserify`, `stream-browserify`, `util`, and local stubs in `webworker/`.

The published payload is bundle-centric. `.vscodeignore` excludes source,
tests, config files, `node_modules`, and build tooling so the VSIX ships the
compiled artifacts and user-facing assets.

## Testing And CI

The `test` script is broad:

- `node --test --experimental-test-coverage`
- ESLint and markdownlint self-checks
- production webpack compile
- schema copy/embed/update checks
- `git diff --exit-code` to prove generated schemas are current

The `ci` script adds VS Code UI tests. GitHub Actions installs dependencies with
`npm install --no-package-lock`, runs `npm test`, then runs UI tests under Xvfb.
`package.json` also defines `npm run test-web` for `@vscode/test-web`, but the
GitHub Actions CI workflow does not run it.

## Workspace Trust And Virtual Workspaces

Upstream declares limited support for both untrusted and virtual workspaces.
The manifest says JavaScript is blocked for custom rules, markdown-it plugins,
and configuration files in those modes. The source also avoids raw Node `fs` in
important paths by adapting to `vscode.workspace.fs`, which helps browser and
virtual-workspace support.

## Relevance To Flavor Grenade

What to copy as reference:

- Manifest discipline: explicit commands, configuration, workspace trust, and
  virtual workspace declarations.
- Bundle hygiene: ship compiled output and assets, not source and tests.
- Configuration ergonomics: typed settings, schema contributions, and command
  palette entries.
- CI shape: compile, lint, test, package-adjacent checks, and UI smoke tests.
- Web-awareness: make an explicit decision instead of accidental incompatibility.

What not to copy directly:

- In-process domain logic. Flavor Grenade already has a standalone LSP server.
- JavaScript/ESM source style. This repo's stack is TypeScript-first.
- webpack as a default. The existing Flavor Grenade extension uses esbuild,
  which is simpler and aligned with the current local stack.
- Web extension support as a first milestone. Flavor Grenade needs vault file
  access and currently spawns a language server binary, so workspace-only
  desktop support is the cleaner baseline.

## Companion Extension Baseline

For the Flavor Grenade companion extension, the reference stack should be:

| Area | Recommended Flavor Grenade direction |
|---|---|
| Language | TypeScript |
| Runtime | VS Code workspace extension |
| Core protocol | `vscode-languageclient` over stdio |
| Server | Bundled or configured `flavor-grenade-lsp` binary |
| Build | esbuild bundle to `dist/extension.js` |
| Package manager | npm for extension package, Bun for server repo workflow |
| Activation | `onLanguage:markdown` and `onLanguage:ofmarkdown` |
| Trust posture | No untrusted or virtual workspace support until server constraints change |
| Tests | Node tests for client code plus VS Code integration smoke tests |
| Packaging | `@vscode/vsce`, strict `.vscodeignore`, bundled server assets |

The main architectural difference is the boundary: `vscode-markdownlint` embeds
the Markdown engine inside the extension host, while Flavor Grenade should keep
the extension as a thin editor client for the LSP server.
