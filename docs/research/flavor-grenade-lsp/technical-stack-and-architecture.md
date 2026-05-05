---
title: flavor-grenade-lsp Technical Stack And Architecture
tags:
  - research/vscode
  - research/lsp
  - research/flavor-grenade
updated: 2026-05-05
sources:
  - https://github.com/alisonaquinas/flavor-grenade-lsp
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/package.json
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/README.md
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/src/main.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/src/lsp/lsp.module.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/docs/architecture/overview.md
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/docs/architecture/layers.md
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/docs/architecture/data-flow.md
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/package.json
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/src/extension.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/src/server-path.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/src/server-command.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/src/commands.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/src/status-bar.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/extension/src/language-mode.ts
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/docs/adr/ADR015-platform-specific-vsix.md
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/docs/adr/ADR016-ofmarkdown-language-mode.md
  - https://github.com/alisonaquinas/flavor-grenade-lsp/blob/main/.github/workflows/extension-release.yml
  - https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
  - https://code.visualstudio.com/api/extension-guides/workspace-trust
---
# flavor-grenade-lsp Technical Stack And Architecture

## Scope

This note documents the technology stack and architecture of
`alisonaquinas/flavor-grenade-lsp`, with emphasis on its VS Code extension. The
goal is to identify patterns worth reusing for a future `markdownlint-obsidian`
extension while keeping this repository's linter domain separate.

Source snapshot: upstream `main` at
`dc66d9bcc5102800e75ac78921aa2e3a4ce3441b`, checked on 2026-05-05.

## Stack Summary

| Area | flavor-grenade-lsp choice |
|---|---|
| Server purpose | LSP server for Obsidian Flavored Markdown vault intelligence |
| Server runtime | Bun during development; compiled Bun binary for packaged extension |
| Server language | TypeScript ESM |
| Server framework | NestJS application context, not an HTTP app |
| Server protocol | stdio JSON-RPC using LSP method names |
| Server dependencies | `@nestjs/*`, `reflect-metadata`, `rxjs`, `js-yaml`, `vscode-languageserver-*` protocol and text document packages |
| Server build | `tsc`; optional `bun build --compile` through `scripts/build-binary.mjs` |
| Server tests | `bun test`, Cucumber BDD smoke suite, integration tests |
| Extension runtime | VS Code workspace extension only |
| Extension language | TypeScript |
| Extension protocol client | `vscode-languageclient/node` |
| Extension build | esbuild bundle to `extension/dist/extension.js` |
| Extension package manager | npm inside `extension/` |
| Extension packaging | `@vscode/vsce`, platform-specific VSIXs |
| Extension activation | `onLanguage:markdown`, `onLanguage:ofmarkdown` |
| Extension trust posture | Untrusted workspaces unsupported |
| Extension virtual workspace posture | Virtual workspaces unsupported |

## Server Architecture

The server is a standalone LSP process. Editors launch it as a child process and
communicate over stdin/stdout. Logs go to stderr. There is no HTTP listener,
WebSocket endpoint, or shared daemon state.

The entry point is `src/main.ts`. It imports `reflect-metadata`, creates a
NestJS application context from `LspModule`, and initializes the container. The
root module then registers JSON-RPC request and notification handlers and starts
the stdio reader.

Important server layers:

| Layer | Responsibility |
|---|---|
| Transport | stdio framing, JSON-RPC dispatch, stdout writer |
| Parser | OFM parse pipeline for wiki-links, embeds, tags, callouts, frontmatter, math, comments, and block anchors |
| Vault | vault root detection, file watching, vault index, single-file fallback |
| Resolution | wiki-link, embed, block-ref, and tag resolution through an Oracle and reference graph |
| Features | completions, diagnostics, definitions, references, hover, rename, code actions, code lens, document symbols, semantic tokens |
| LSP | capability registration, lifecycle handlers, request routing, serialization |

The system uses NestJS modules as dependency boundaries. Upper layers import
lower layers; the transport and LSP layers are the outer edge. This is useful
for `markdownlint-obsidian` because the current repo already has strong domain
layer boundaries. The reusable idea is not NestJS itself; it is the explicit
boundary between editor protocol, application behavior, and pure linting logic.

## Runtime Data Flow

Document changes use full-text sync. On `textDocument/didChange`, the server
rebuilds the document model from the new full text, replaces the immutable
document value, computes symbol diffs, updates the reference graph
incrementally, and republishes diagnostics only for affected documents.

Completion requests read from the current document and vault index. Trigger
characters route to specialized providers for wiki-links, embeds, tags,
callouts, headings, and block references. The configured completion candidate
limit caps the response.

This split matters for a linter extension: diagnostics should flow from the
server's document state, while commands and editor UI should stay in the thin
extension client.

## VS Code Extension Architecture

The VS Code extension is a thin LSP client.

`extension/src/extension.ts` does the main work:

- resolves the server command;
- creates `ServerOptions` for run and debug;
- creates `LanguageClientOptions` with a file-only selector for `markdown` and
  `ofmarkdown`;
- watches `**/*.md`;
- sends initialization options from `flavorGrenade.*` settings;
- starts `LanguageClient`;
- registers a status bar, commands, and dynamic language-mode controller;
- restarts the client when `flavorGrenade.server.path` changes.

This matches VS Code's documented language-server extension shape: create
server options, define client options with document selectors and file events,
then start a `LanguageClient`.

## Extension Contributions

`extension/package.json` contributes:

- language id `ofmarkdown`;
- TextMate grammar for `ofmarkdown`;
- commands:
  - `flavorGrenade.restartServer`;
  - `flavorGrenade.rebuildIndex`;
  - `flavorGrenade.showOutput`;
- settings:
  - `flavorGrenade.server.path`;
  - `flavorGrenade.linkStyle`;
  - `flavorGrenade.completion.candidates`;
  - `flavorGrenade.diagnostics.suppress`;
  - `flavorGrenade.trace.server`;
- workspace capability declarations that reject untrusted and virtual
  workspaces.

The extension does not register direct diagnostic, completion, or code-action
providers. Those are exposed by the server through LSP capabilities.

## Server Command Resolution

Server command resolution has three paths:

1. User override from `flavorGrenade.server.path`, resolved and checked for
   existence.
2. Development mode, which runs `node ../dist/main.js`.
3. Packaged mode, which runs `server/flavor-grenade-lsp` or
   `server/flavor-grenade-lsp.exe` inside the VSIX.

There is no PATH fallback, environment-variable lookup, or activation-time
download. That is a deliberate distribution choice: platform-specific VSIXs
must include the correct binary.

## Client-Side Commands And Status

The command module is intentionally small:

- restart calls `client.restart()`;
- rebuild index sends custom request `flavorGrenade/rebuildIndex`;
- show output reveals the language client's output channel.

The status bar listens for custom `flavorGrenade/status` notifications with
states `initializing`, `indexing`, `ready`, and `error`. It is an editor-only
presentation layer over server lifecycle events.

## Dynamic OFMarkdown Mode

Flavor Grenade does not globally claim every `.md` file. Files open as VS
Code's built-in `markdown`. The extension promotes qualifying vault documents
to `ofmarkdown`.

Promotion has two checks:

- fast client-side ancestor scan for `.obsidian/`;
- server-authoritative `flavorGrenade/documentMembership` request.

The extension uses a loop guard because `setTextDocumentLanguage` causes VS Code
to reopen the document. It also registers the language client for both
`markdown` and `ofmarkdown`, so LSP features continue during and after
promotion.

This is directly relevant to `markdownlint-obsidian`: the extension should
avoid hijacking generic Markdown files unless the repo explicitly decides that
all Markdown should receive Obsidian-aware linting.

## Packaging And CI

ADR 015 chooses platform-specific VSIXs. The release workflow builds seven
targets:

- `linux-x64`;
- `linux-arm64`;
- `alpine-x64`;
- `darwin-x64`;
- `darwin-arm64`;
- `win32-x64`;
- `win32-arm64`.

Each build cross-compiles the Bun server binary, installs extension
dependencies, bundles the extension client with esbuild, packages a targeted
VSIX, writes checksums, attests provenance, and uploads artifacts. Publishing
then verifies checksums and publishes all VSIXs with `vsce`.

The `.vscodeignore` excludes source, docs, tests, node modules, scripts, and
config files while keeping `dist/**`. Packaged payload is therefore the bundled
extension client plus the platform binary and user-facing assets.

## Relevance To markdownlint-obsidian

Good patterns to copy:

- Thin VS Code extension that delegates domain behavior to a separate engine or
  server.
- `vscode-languageclient` as the client boundary if this repo adds an LSP
  server.
- `server.path` escape hatch for development and local testing.
- Custom requests for extension-specific lifecycle commands.
- Status bar backed by server notifications.
- Explicit trust and virtual workspace declarations.
- esbuild bundling with `vscode` external.
- `.vscodeignore` discipline.
- Platform-aware binary strategy, if the server becomes a compiled artifact.
- Separate extension package under `extension/` with npm tooling.

Patterns to evaluate before copying:
- NestJS in the server. Useful for large injectable feature modules, but this
  repo already has a domain/application/infrastructure split.
- Platform-specific VSIXs. Good when a native or compiled server is mandatory;
  too heavy if a Node-compatible package can be spawned.
- Dynamic language mode. Useful if we want OFM-specific editor settings without
  claiming all Markdown files.
- Full-text LSP sync. Simple and likely acceptable for Markdown linting, but
  large vault workflows should be profiled.

## Initial Extension Direction

For `markdownlint-obsidian`, a Flavor Grenade-style VS Code extension should
start with this shape:

| Area | Recommended direction |
|---|---|
| Extension location | `extension/` workspace sibling to `packages/` |
| Extension language | TypeScript |
| Extension bundle | esbuild to `extension/dist/extension.js` |
| VS Code API | direct use of `vscode` plus `vscode-languageclient` only if an LSP server is introduced |
| Server or engine | Prefer existing core package first; introduce an LSP boundary when live diagnostics need shared document state |
| Activation | `onLanguage:markdown`; optional future `onLanguage:ofmarkdown` |
| Workspace trust | Start unsupported or limited until file-system behavior is explicitly designed |
| Virtual workspaces | Start unsupported unless all file I/O uses `vscode.workspace.fs` or a serverless mode |
| Commands | restart or reload engine, lint workspace, show output, open config |
| Configuration | mirror CLI/core options, plus extension-only output and server path settings |
| Tests | unit tests for command/path logic, VS Code integration smoke tests for activation and diagnostics |
| Packaging | `@vscode/vsce`; strict `.vscodeignore`; build artifact checked by CI |

The key architectural decision remains open: in-process extension client around
`packages/core`, or a separate LSP server that wraps core. Flavor Grenade is
evidence for the second option when editor features need persistent vault state,
cross-document indexing, and custom lifecycle notifications.
