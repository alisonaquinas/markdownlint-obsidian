---
title: "Contributions And Trust"
aliases:
  - "Contributions And Trust"
  - "Requirements / Functional / Contributions And Trust"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/functional"
  - "requirements"
type: "functional-requirement"
status: "current"
updated: 2026-05-09
up: "[[requirements/functional/index]]"
---

# Contributions And Trust

## MarkdownlintObsidian.ManifestContributions

```text
Tag: MarkdownlintObsidian.ManifestContributions
Gist: Contribute extension dependency, activation, commands, configuration, and UI entries to VS Code.
Ambition: VS Code exposes markdownlint-obsidian behavior through native contribution points.
Scale: Percentage of documented manifest contribution points present with expected ids, titles, defaults, scopes, activation events, dependency ids, and paths.
Meter: Manifest inspection test against extension `package.json` for `extensionDependencies`, `activationEvents`, commands, command-palette menus, configuration properties, JSON validation, problem matchers if used, and extension kind/capabilities.
Fail: Any documented contribution is missing, renamed without migration, scoped incorrectly, has wrong defaults, or points to missing files.
Goal: 100% manifest contribution match for documented contribution inventory.
Stakeholders: Markdown authors, VS Code users, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [[README]]; [[architecture/flavor-grenade-dependency]].
```

User trace: [[requirements/user/editing-feedback]], [[requirements/user/configuration]]

## MarkdownlintObsidian.SchemaValidation

```text
Tag: MarkdownlintObsidian.SchemaValidation
Gist: Attach markdownlint-obsidian schemas to supported JSON and JSONC config files.
Ambition: Users receive editor validation while authoring linter configuration.
Scale: Percentage of supported JSON and JSONC config filenames that receive the correct schema for the current extension version.
Meter: Manifest inspection and VS Code smoke test for `.obsidian-linter.jsonc`, `.obsidian-linter.json`, `.markdownlint-cli2.jsonc`, `.markdownlint.jsonc`, `obsidian-linter.config.jsonc`, and `obsidian-linter.config.json`.
Fail: Any supported JSON or JSONC config file lacks schema validation, points to the wrong schema, or validates against stale config fields.
Goal: 100% of supported JSON and JSONC config filenames receive the expected schema.
Stakeholders: Repository maintainers, Markdown authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [[requirements/user/configuration]]; [LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts).
```

User trace: [[requirements/user/configuration]]

## MarkdownlintObsidian.ConfigParityDelegation

```text
Tag: MarkdownlintObsidian.ConfigParityDelegation
Gist: Delegate markdownlint-cli2-compatible config discovery, parsing, pointer handling, and effective-config grouping to the bundled core library.
Ambition: Editor diagnostics match CLI and CI diagnostics for projects that use markdownlint-cli2-style configuration.
Scale: Percentage of core-supported config behaviors observable from the extension without extension-specific reimplementation.
Meter: Extension integration tests that exercise core config parity fixtures through the public engine API, including explicit config, nested config, `.markdownlint.*` override of embedded CLI2 `config`, and schema-backed JSON/JSONC editing where applicable.
Fail: The extension resolves a different effective config from the CLI for the same workspace, ignores a core-supported config source without a documented limitation, or duplicates core config logic in VS Code code.
Goal: 100% parity with core-supported config behavior for local trusted file workspaces.
Stakeholders: Repository maintainers, Markdown authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [config parity plan](../../../../docs/plans/phase-15-cli2-config-parity.md); [markdownlint-cli2 config research](../../../../docs/research/markdownlint-cli2-config-loading-analysis.md).
```

User trace: [[requirements/user/configuration]], [[requirements/user/configuration]]

## MarkdownlintObsidian.WorkspaceTrust

```text
Tag: MarkdownlintObsidian.WorkspaceTrust
Gist: Gate file-system-dependent and code-loading behavior on VS Code workspace trust.
Ambition: Built-in linting remains predictable while risky workspace code execution is blocked unless trusted.
Scale: Percentage of lint invocations where behavior matches trust policy for built-in rules, custom rules, config loading, file discovery, and fix writes.
Meter: Integration test covering trusted local workspace, untrusted workspace, no workspace, command-only activation, live `ofmarkdown` linting, workspace linting, quick fixes, and fix-all.
Fail: Custom code is loaded in untrusted contexts, file writes occur when trust policy forbids them, or safe built-in behavior is unnecessarily blocked without a clear message.
Goal: 100% of covered trust contexts match documented policy.
Stakeholders: Security-conscious users, repository maintainers, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [[requirements/user/workspace-and-trust]]; [custom rules guide](../../../../docs/guides/custom-rules.md).
```

User trace: [[requirements/user/workspace-and-trust]], [[requirements/user/workspace-and-trust]]

## MarkdownlintObsidian.CustomRuleTrust

```text
Tag: MarkdownlintObsidian.CustomRuleTrust
Gist: Load custom rule modules only in trusted supported contexts.
Ambition: Project-specific lint policy works in the editor without silently executing untrusted workspace code.
Scale: Percentage of custom-rule lint invocations where configured modules are loaded, skipped, or reported according to trust, URI scheme, runtime, and extension settings.
Meter: Unit or integration test with trusted custom rules, untrusted workspace, missing custom rule file, duplicate custom rule names, throwing custom rule module, and disabled custom rules setting if present.
Fail: A custom rule module loads in a blocked context, a permitted custom rule is skipped without explanation, or load failures are hidden.
Goal: 100% of covered custom-rule contexts match documented policy and produce actionable output.
Stakeholders: Repository maintainers, security reviewers, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [CustomRuleLoader](../../../../packages/core/src/infrastructure/config/CustomRuleLoader.ts); [[requirements/user/configuration]].
```

User trace: [[requirements/user/configuration]], [[requirements/user/workspace-and-trust]]

## MarkdownlintObsidian.FileSystemStrategy

```text
Tag: MarkdownlintObsidian.FileSystemStrategy
Gist: Use a documented file-system strategy for config, discovery, vault lookup, and fixes.
Ambition: Users know which local, remote, and virtual workspace modes can support vault-aware linting.
Scale: Percentage of file-system operations required by linting and fixing that are either implemented for the workspace mode or intentionally blocked with a clear user-facing reason.
Meter: Integration test for config reads, file discovery, document reads, vault detection, file existence checks, fix writes, and output paths across local file workspaces and each declared unsupported mode.
Fail: A required file-system operation fails silently, probes unsupported storage, writes in an unsupported mode, or reports an ambiguous error.
Goal: 100% of required file-system operations are implemented or intentionally rejected with actionable output.
Stakeholders: Remote workspace users, Obsidian vault authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [engine lint API](../../../../packages/core/src/engine/index.ts); [[requirements/user/workspace-and-trust]].
```

User trace: [[requirements/user/workspace-and-trust]], [[requirements/user/workspace-and-trust]]
