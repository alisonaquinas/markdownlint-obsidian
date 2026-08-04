# Changelog

## Unreleased

## 0.8.2 - 2026-08-03

### Changed

- Bundle `markdownlint-obsidian` 1.4.0 and refresh extension development
  dependencies.

## 0.8.1 - 2026-06-09

### Changed

- Refresh extension development dependencies, including TypeScript, Node types,
  esbuild, and `@vscode/vsce`.

### Fixed

- Extension-host smoke tests now package the Flavor Grenade test stub through
  the extension-local `@vscode/vsce` entry point instead of a workspace `.bin`
  shim.

## 0.8.0 - 2026-06-09

### Added

- Add VS Code extension package scaffold, live diagnostics, quick fixes,
  workspace commands, trust policy, package checks, and Marketplace release
  workflow planning.

### Fixed

- Harden F5 profile helper scripts on Windows by invoking VS Code's `Code.exe`
  with `cli.js` directly instead of routing through `cmd.exe`.
- Remove the package-check file-system race flagged by CodeQL.

### Security

- Pin the VS Code extension release workflow's third-party Bun setup action to
  an immutable commit SHA.
