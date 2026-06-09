---
title: "vscode-markdownlint User Requirements - Configuration"
aliases:
  - "vscode-markdownlint User Requirements - Configuration"
tags:
  - "research/vscode"
  - "research/markdownlint"
  - "requirements/user"
  - "docs"
  - "docs/research"
  - "docs/research/vscode-markdownlint"
type: "research"
status: "current"
updated: 2026-05-04
up: "[[research/vscode-markdownlint/technical-stack]]"
sources:
  - ../functional/editing-linting.md
  - ../functional/workspace-commands.md
  - ../functional/contributions-and-trust.md
---

# Configuration

```text
Tag: UserMarkdownlint.ConfigSources
Need: As a repository maintainer, I need markdownlint to honor project configuration files and VS Code settings, so editor feedback matches repository policy.
Derived from: Markdownlint.ConfigurationResolution.
Acceptance cue: Runtime linting combines default config, discovered config files, `.markdownlint-cli2*` options, `markdownlint.config`, `markdownlint.configFile`, custom rules, and supported `extends` behavior according to source-defined precedence.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.ConfigurationResolution|Markdownlint.ConfigurationResolution]]

```text
Tag: UserMarkdownlint.ConfigDiscovery
Need: As a Markdown author, I need a command that opens or starts the workspace configuration file, so I do not have to memorize supported markdownlint filenames.
Derived from: Markdownlint.OpenConfigFile.
Acceptance cue: `markdownlint.openConfigFile` opens the first existing supported config file for each workspace folder, or creates an untitled `.markdownlint.json` draft with the default config.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/workspace-commands#Markdownlint.OpenConfigFile|Markdownlint.OpenConfigFile]]

```text
Tag: UserMarkdownlint.SchemaAssistance
Need: As a repository maintainer, I need JSON and YAML schema validation while editing markdownlint config, so mistakes are caught before they affect linting.
Derived from: Markdownlint.SchemaValidation; Markdownlint.ManifestContributions.
Acceptance cue: Supported `.markdownlint*` and `.markdownlint-cli2*` JSON/YAML config filenames receive the contributed markdownlint schemas.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.SchemaValidation|Markdownlint.SchemaValidation]], [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.ManifestContributions|Markdownlint.ManifestContributions]]

```text
Tag: UserMarkdownlint.CustomRules
Need: As a repository maintainer, I need to load custom rules when the workspace context is allowed to import JavaScript, so project-specific Markdown policy can be enforced in the editor.
Derived from: Markdownlint.ConfigurationResolution; Markdownlint.WorkspaceTrust.
Acceptance cue: Custom rule paths from VS Code settings or markdownlint-cli2 options are passed to the lint engine when imports are allowed and blocked when trust, scheme, or runtime disallows imports.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/editing-linting#Markdownlint.ConfigurationResolution|Markdownlint.ConfigurationResolution]], [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.WorkspaceTrust|Markdownlint.WorkspaceTrust]]

```text
Tag: UserMarkdownlint.Snippets
Need: As a Markdown author, I need snippets for markdownlint control comments, so I can suppress, restore, or configure rules inline without remembering exact comment syntax.
Derived from: Markdownlint.Snippets.
Acceptance cue: Markdown IntelliSense offers the source-defined markdownlint suppression and configuration snippets for Markdown documents.
```

Functional trace: [[research/vscode-markdownlint/requirments/functional/contributions-and-trust#Markdownlint.Snippets|Markdownlint.Snippets]]
