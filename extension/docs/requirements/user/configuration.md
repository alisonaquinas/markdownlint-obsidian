---
title: "Configuration"
aliases:
  - "Configuration"
  - "Requirements / User / Configuration"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/user"
  - "requirements"
type: "user-requirement"
status: "current"
updated: 2026-05-09
up: "[[requirements/user/index]]"
---

# Configuration

```text
Tag: UserMarkdownlintObsidian.ConfigSources
Need: As a repository maintainer, I need extension diagnostics to honor project configuration files and extension settings, so editor feedback matches CI.
Capability basis: markdownlint-obsidian loads `.obsidian-linter.*`, `.markdownlint-cli2.*`, and `.markdownlint.*` config files and merges discovered layers with defaults.
Acceptance cue: The extension resolves configuration the same way as the core or clearly documents any editor-only override precedence. As the core moves toward markdownlint-cli2 configuration parity, the extension must inherit that behavior through the bundled library rather than reimplementing discovery.
```

Source trace:
[ConfigLoader](../../../../packages/core/src/infrastructure/config/ConfigLoader.ts),
[defaults](../../../../packages/core/src/infrastructure/config/defaults.ts),
[LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts),
[config parity plan](../../../../docs/plans/phase-15-cli2-config-parity.md),
[markdownlint-cli2 config research](../../../../docs/research/markdownlint-cli2-config-loading-analysis.md)

```text
Tag: UserMarkdownlintObsidian.ConfigDiscovery
Need: As a Markdown author, I need a command that opens or starts the workspace linter configuration, so I do not have to remember supported filenames.
Capability basis: the core supports several config filenames, with `.obsidian-linter.jsonc` as the project-specific default.
Acceptance cue: A command opens the nearest supported config file or creates an untitled `.obsidian-linter.jsonc` starter when none exists. When core parity expands supported discovery to `.markdownlint-cli2.cjs`, `.markdownlint-cli2.mjs`, `.markdownlint.json`, `.markdownlint.yml`, `.markdownlint.cjs`, and `.markdownlint.mjs`, the extension open-config order is updated or the unsupported editor-only limitation is documented.
```

Source trace:
[ConfigLoader](../../../../packages/core/src/infrastructure/config/ConfigLoader.ts),
[[requirements/index]],
[config parity plan](../../../../docs/plans/phase-15-cli2-config-parity.md)

```text
Tag: UserMarkdownlintObsidian.SchemaAssistance
Need: As a repository maintainer, I need schema validation and completion while editing JSON or JSONC linter config, so bad config is caught before diagnostics disappear or drift from CI.
Capability basis: `LinterConfig` is a typed, validated shape consumed by every lint run.
Acceptance cue: Supported JSON and JSONC config filenames receive schema-backed validation for top-level config, rule toggles, globs, ignores, vault root, and family options. YAML, CJS, MJS, and TOML explicit config remain loadable by the core engine as parity expands, but schema assistance is provided only where VS Code can attach a JSON schema.
```

Source trace:
[LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts),
[ConfigValidator](../../../../packages/core/src/infrastructure/config/ConfigValidator.ts)

```text
Tag: UserMarkdownlintObsidian.CustomRules
Need: As a repository maintainer, I need editor linting to load allowed custom rules, so project-specific vault policy appears in the editor before CI.
Capability basis: markdownlint-obsidian supports custom rule modules through `customRules` and reports custom rule load failures as system diagnostics.
Acceptance cue: Trusted local workspaces can load configured custom rules; failed or duplicate custom rules surface actionable diagnostics or output.
```

Source trace:
[custom rules guide](../../../../docs/guides/custom-rules.md),
[CustomRuleLoader](../../../../packages/core/src/infrastructure/config/CustomRuleLoader.ts),
[custom rule system docs](../../../../docs/rules/system/OFM904.md),
[custom rule load failure docs](../../../../docs/rules/system/OFM905.md)

```text
Tag: UserMarkdownlintObsidian.RuleFamilyVisibility
Need: As a Markdown author, I need settings and documentation to use OFM rule families, so I can understand whether an issue belongs to wikilinks, embeds, callouts, tags, frontmatter, block references, highlights, comments, system rules, or standard Markdown.
Capability basis: rule codes and docs are grouped by family.
Acceptance cue: Extension UI, docs, and configuration help preserve rule codes and family names instead of flattening all diagnostics into generic Markdown warnings.
```

Source trace:
[rule catalog](../../../../docs/rules/index.md),
[LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts)
