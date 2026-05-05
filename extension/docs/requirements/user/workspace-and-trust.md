# Workspace And Trust

```text
Tag: UserMarkdownlintObsidian.WorkspaceLint
Need: As a repository maintainer, I need to lint all configured Markdown files in the workspace from VS Code, so I can check vault quality without leaving the editor.
Capability basis: the CLI and core support glob-based linting, ignores, config discovery, vault root detection, and output formatters.
Acceptance cue: A Command Palette action runs workspace lint with configured globs and shows results in an output channel, task, terminal, or Problems integration.
```

Source trace:
[CLI args](../../../../packages/cli/src/args.ts),
[engine lint API](../../../../packages/core/src/engine/index.ts),
[LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts)

```text
Tag: UserMarkdownlintObsidian.TemporaryDisable
Need: As a Markdown author, I need to pause and resume live diagnostics temporarily, so large edits do not require persistent config changes.
Capability basis: VS Code extensions can clear and republish diagnostics independently from project config.
Acceptance cue: A temporary toggle clears current extension diagnostics when disabled, re-lints visible Markdown when re-enabled, and does not edit config files.
```

Source trace:
[extension architecture](../../architecture/overview.md)

```text
Tag: UserMarkdownlintObsidian.TrustedCustomRules
Need: As a security-conscious user, I need JavaScript custom rules to be blocked unless the workspace is trusted, so editor linting does not silently execute untrusted workspace code.
Capability basis: custom rules are executable modules loaded from config.
Acceptance cue: Custom rule loading is disabled in untrusted workspaces; users receive a clear message explaining that built-in rules can still run if supported.
```

Source trace:
[custom rules guide](../../../../docs/guides/custom-rules.md),
[CustomRuleLoader](../../../../packages/core/src/infrastructure/config/CustomRuleLoader.ts),
[extension architecture](../../architecture/overview.md)

```text
Tag: UserMarkdownlintObsidian.UnsupportedWorkspaceModes
Need: As a remote or browser-based VS Code user, I need the extension to state what is supported, so I understand why vault-aware linting may be unavailable.
Capability basis: markdownlint-obsidian currently uses Node filesystem adapters for config, discovery, vault detection, and file existence checks; live linting also depends on Flavor Grenade assigning `ofmarkdown`.
Acceptance cue: The extension declares and documents its trusted, remote, virtual workspace, and Flavor Grenade dependency behavior before enabling file-system-dependent features.
```

Source trace:
[engine lint API](../../../../packages/core/src/engine/index.ts),
[Node vault detector](../../../../packages/core/src/infrastructure/vault/NodeFsVaultDetector.ts),
[Node fs checker](../../../../packages/core/src/infrastructure/fs/NodeFsExistenceChecker.ts),
[Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md)

```text
Tag: UserMarkdownlintObsidian.ActionableErrors
Need: As a Markdown author or maintainer, I need config, vault, custom rule, and lint failures to be reported in understandable output, so I can fix the workspace instead of guessing why diagnostics stopped.
Capability basis: the core emits system rules for parser errors, duplicate custom rules, custom rule load failures, and fix conflicts.
Acceptance cue: Extension output preserves error messages, rule codes, file paths, and suggested next steps where available.
```

Source trace:
[system rules](../../../../docs/rules/index.md#system-ofm900ofm999),
[ConfigLoader](../../../../packages/core/src/infrastructure/config/ConfigLoader.ts),
[autofix guide](../../../../docs/guides/autofix.md)

```text
Tag: UserMarkdownlintObsidian.MetadataConfidence
Need: As an extension user or maintainer, I need extension metadata, bundled engine version, README, rule docs, and changelog links to agree, so the UI describes the rules actually running.
Capability basis: this repo publishes core and CLI packages with semver and keeps rule docs in versioned source.
Acceptance cue: Release checks verify extension package metadata and documentation links against the bundled or declared `markdownlint-obsidian` version.
```

Source trace:
[public API stability](../../../../docs/guides/public-api.md),
[install guide](../../../../docs/guides/install.md),
[CHANGELOG](../../../../CHANGELOG.md)
