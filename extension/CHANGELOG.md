# Changelog

## Unreleased

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
