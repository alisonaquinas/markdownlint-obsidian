# Editing And Linting

## MarkdownlintObsidian.ExtensionDependency

```text
Tag: MarkdownlintObsidian.ExtensionDependency
Gist: Depend on Flavor Grenade for OFMarkdown document classification.
Ambition: Live linting runs only for documents Flavor Grenade has identified as Obsidian Flavored Markdown.
Scale: Percentage of extension manifests and activation paths that declare or verify `alisonaquinas.flavor-grenade-lsp` before enabling automatic live linting, using Flavor Grenade `v0.3.0`/extension `0.1.4` as the compatibility baseline.
Meter: Manifest inspection for `extensionDependencies`, plus VS Code integration tests with Flavor Grenade installed, disabled, missing, blocked by Restricted Mode, and blocked by a virtual workspace.
Fail: Live linting silently falls back to all `markdown` documents, ignores a Flavor Grenade disabled-state guardrail, or missing dependency behavior is not visible to users.
Goal: 100% of automatic live-lint paths require installed Flavor Grenade dependency or report a clear missing-dependency state.
Stakeholders: Obsidian vault authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md); [Flavor Grenade v0.3.0 release](https://github.com/alisonaquinas/flavor-grenade-lsp/releases/tag/v0.3.0).
```

User trace: [UserMarkdownlintObsidian.FlavorGrenadeDependency](../user/editing-feedback.md)

## MarkdownlintObsidian.Activation

```text
Tag: MarkdownlintObsidian.Activation
Gist: Activate live linting for OFMarkdown documents.
Ambition: Lint diagnostics become available automatically when a vault note enters OFMarkdown mode.
Scale: Percentage of VS Code sessions where the extension activates after opening, switching to, or being promoted into an `ofmarkdown` document.
Meter: VS Code extension-host smoke test that opens a Flavor Grenade-recognized vault note, observes the `markdown` to `ofmarkdown` language-change path when applicable, and verifies diagnostics, commands, and output channel registration.
Fail: Any manifest-supported `ofmarkdown` activation scenario does not activate the extension.
Goal: 100% of manifest-supported `ofmarkdown` activation scenarios activate the extension.
Stakeholders: Markdown authors, VS Code users, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [architecture overview](../../architecture/overview.md); [Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md).
```

User trace: [UserMarkdownlintObsidian.AutomaticActivation](../user/editing-feedback.md)

## MarkdownlintObsidian.DocumentEligibility

```text
Tag: MarkdownlintObsidian.DocumentEligibility
Gist: Live-lint only eligible OFMarkdown documents.
Ambition: The extension avoids noisy generic Markdown linting while supporting vault documents selected by Flavor Grenade.
Scale: Percentage of live-lint requests whose eligibility decision matches this predicate: language id is `ofmarkdown`, URI scheme is supported by the execution strategy, Flavor Grenade is available for automatic classification, linting is enabled, and required configuration can be resolved or reported.
Meter: Unit or integration test with `ofmarkdown`, `markdown`, markdown-to-ofmarkdown promotion, ofmarkdown-to-markdown demotion, non-Markdown, untitled, file, remote-like, virtual-like, trusted, and untrusted document contexts.
Fail: Any generic `markdown` document receives automatic live diagnostics by default, any eligible `ofmarkdown` document is skipped, any demoted document keeps stale diagnostics, or any unsupported document is linted without a clear policy.
Goal: 100% predicate match for covered document categories.
Stakeholders: Obsidian vault authors, generic Markdown authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md); [user editing requirements](../user/editing-feedback.md).
```

User trace: [UserMarkdownlintObsidian.OFMRelevantDocuments](../user/editing-feedback.md)

## MarkdownlintObsidian.LintTrigger

```text
Tag: MarkdownlintObsidian.LintTrigger
Gist: Run linting on configured OFMarkdown editor lifecycle events.
Ambition: Diagnostics stay current while respecting user-selected run mode and temporary-disable state.
Scale: Percentage of in-scope editor events that request, suppress, clear, or refresh diagnostics according to extension state.
Meter: VS Code integration test covering document open, language-mode change to `ofmarkdown`, language-mode demotion back to `markdown`, text change with run mode `onType`, save with run mode `onSave`, close, visible editor change, configuration change, workspace trust change, Flavor Grenade disabled state, and temporary-disable state.
Fail: Any in-scope lifecycle event leaves stale diagnostics, runs linting while disabled, ignores run mode, or lints an ineligible document.
Goal: 100% of in-scope lifecycle events match configured behavior.
Stakeholders: Markdown authors, VS Code users.
Owner: markdownlint-obsidian VS Code extension.
Source: [user editing requirements](../user/editing-feedback.md); [workspace and trust requirements](../user/workspace-and-trust.md).
```

User trace: [UserMarkdownlintObsidian.CurrentDiagnostics](../user/editing-feedback.md), [UserMarkdownlintObsidian.RunModeControl](../user/editing-feedback.md), [UserMarkdownlintObsidian.TemporaryDisable](../user/workspace-and-trust.md)

## MarkdownlintObsidian.ConfigurationResolution

```text
Tag: MarkdownlintObsidian.ConfigurationResolution
Gist: Resolve lint configuration the same way as markdownlint-obsidian core unless an editor-only override is documented.
Ambition: Editor diagnostics match CLI and CI behavior for the same workspace content.
Scale: Percentage of lint invocations whose effective config matches core `loadConfig` plus documented extension-only overrides.
Meter: Integration test invoking document linting with `.obsidian-linter.jsonc`, `.obsidian-linter.yaml`, `.markdownlint-cli2.jsonc`, `.markdownlint-cli2.yaml`, `.markdownlint.jsonc`, `.markdownlint.yaml`, nested config layers, rule overrides, globs, ignores, vault root, and disabled resolution.
Fail: A supported config source is ignored, merged in the wrong precedence order, resolved from the wrong base directory, or diverges from core behavior without a documented extension-specific reason.
Goal: 100% of covered configuration combinations match core behavior or documented extension override behavior.
Stakeholders: Repository maintainers, Markdown authors, CI maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [ConfigLoader](../../../../packages/core/src/infrastructure/config/ConfigLoader.ts); [configuration user requirements](../user/configuration.md).
```

User trace: [UserMarkdownlintObsidian.ConfigSources](../user/configuration.md)

## MarkdownlintObsidian.Diagnostics

```text
Tag: MarkdownlintObsidian.Diagnostics
Gist: Convert markdownlint-obsidian lint results into VS Code diagnostics.
Ambition: Authors see rule violations in the editor and Problems panel with correct location, severity, source, code, message, and fix metadata.
Scale: Percentage of reportable `LintError` objects converted into expected VS Code diagnostics for eligible `ofmarkdown` documents.
Meter: Integration test with OFM, MD, custom, and system rule results covering error and warning severities, line and column positions, missing or invalid ranges, fix payloads, stale results, config errors, and cleared diagnostics after close or disable.
Fail: Any reportable result lacks a diagnostic, has wrong range, severity, source, rule code, message, or persists after it is stale or disabled.
Goal: 100% of reportable results are converted correctly and 100% of suppressed, stale, or ineligible results are omitted.
Stakeholders: Markdown authors, repository maintainers, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [LintError](../../../../packages/core/src/domain/linting/LintError.ts); [rule catalog](../../../../docs/rules/index.md); [editing user requirements](../user/editing-feedback.md).
```

User trace: [UserMarkdownlintObsidian.CurrentDiagnostics](../user/editing-feedback.md), [UserMarkdownlintObsidian.RuleFamilyVisibility](../user/configuration.md)
