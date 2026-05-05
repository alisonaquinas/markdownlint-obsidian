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
Source: [extension README](../../README.md); [Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md).
```

User trace: [UserMarkdownlintObsidian.FlavorGrenadeDependency](../user/editing-feedback.md), [UserMarkdownlintObsidian.ConfigSources](../user/configuration.md)

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
Source: [SchemaAssistance user requirement](../user/configuration.md); [LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts).
```

User trace: [UserMarkdownlintObsidian.SchemaAssistance](../user/configuration.md)

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
Source: [workspace user requirements](../user/workspace-and-trust.md); [custom rules guide](../../../../docs/guides/custom-rules.md).
```

User trace: [UserMarkdownlintObsidian.TrustedCustomRules](../user/workspace-and-trust.md), [UserMarkdownlintObsidian.UnsupportedWorkspaceModes](../user/workspace-and-trust.md)

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
Source: [CustomRuleLoader](../../../../packages/core/src/infrastructure/config/CustomRuleLoader.ts); [custom rule user requirement](../user/configuration.md).
```

User trace: [UserMarkdownlintObsidian.CustomRules](../user/configuration.md), [UserMarkdownlintObsidian.TrustedCustomRules](../user/workspace-and-trust.md)

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
Source: [engine lint API](../../../../packages/core/src/engine/index.ts); [unsupported workspace user requirement](../user/workspace-and-trust.md).
```

User trace: [UserMarkdownlintObsidian.UnsupportedWorkspaceModes](../user/workspace-and-trust.md), [UserMarkdownlintObsidian.ActionableErrors](../user/workspace-and-trust.md)
