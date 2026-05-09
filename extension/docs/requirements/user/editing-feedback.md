# Editing Feedback

```text
Tag: UserMarkdownlintObsidian.FlavorGrenadeDependency
Need: As an Obsidian vault author, I need the lint extension to use Flavor Grenade's OFMarkdown language mode, so only documents recognized as Obsidian-flavored vault notes receive automatic OFM lint feedback.
Capability basis: Flavor Grenade contributes and assigns the `ofmarkdown` language id; VS Code supports extension dependencies by full `publisher.name` identifier.
Acceptance cue: The extension declares `alisonaquinas.flavor-grenade-lsp` as an extension dependency, targets the `v0.3.0`/extension `0.1.4` contribution surface, and treats `languageId === "ofmarkdown"` as the primary live-lint eligibility signal.
```

Source trace:
[Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md),
[Flavor Grenade research](../../../../docs/research/flavor-grenade-lsp/technical-stack-and-architecture.md),
[Flavor Grenade v0.3.0 release](https://github.com/alisonaquinas/flavor-grenade-lsp/releases/tag/v0.3.0)

```text
Tag: UserMarkdownlintObsidian.AutomaticActivation
Need: As a Markdown author, I need Obsidian-aware linting to become available automatically when a document enters OFMarkdown mode, so I do not have to run the CLI while writing vault notes.
Capability basis: VS Code can activate on contributed language ids; Flavor Grenade promotes qualifying documents to `ofmarkdown`; markdownlint-obsidian exposes core lint APIs.
Acceptance cue: Opening a document that Flavor Grenade marks as `ofmarkdown` activates extension commands and diagnostics without a manual startup step.
The extension also handles the language-change path where Flavor Grenade first
opens a file as `markdown`, starts after its own vault-marker gate, and then
promotes the document to `ofmarkdown`.
```

Source trace:
[extension architecture](../../architecture/overview.md),
[core public API](../../../../docs/guides/public-api.md),
[CLI args](../../../../packages/cli/src/args.ts)

```text
Tag: UserMarkdownlintObsidian.OFMRelevantDocuments
Need: As a Markdown author, I need live linting to target Flavor Grenade-recognized OFMarkdown documents, so generic Markdown documents are not noisy.
Capability basis: Flavor Grenade owns vault membership detection and `ofmarkdown` promotion; markdownlint-obsidian parses OFM syntax inside Markdown files.
Acceptance cue: `ofmarkdown` documents are eligible for live linting; generic `markdown` documents are not linted live unless a separate explicit command or future opt-in setting covers them, even though Flavor Grenade may listen to `markdown` documents for promotion.
```

Source trace:
[rule catalog](../../../../docs/rules/index.md),
[file discovery and lint API](../../../../packages/core/src/engine/index.ts)

```text
Tag: UserMarkdownlintObsidian.CurrentDiagnostics
Need: As a Markdown author, I need diagnostics to reflect the current document content and configuration, so editor underlines and the Problems panel match what the CLI would report.
Capability basis: core lint results expose file, line, column, rule code, severity, message, and fix metadata.
Acceptance cue: Opening, editing, saving, closing, language-mode changes, or changing relevant settings updates or clears diagnostics for affected `ofmarkdown` documents.
```

Source trace:
[LintError](../../../../packages/core/src/domain/linting/LintError.ts),
[LintResult](../../../../packages/core/src/domain/linting/LintResult.ts),
[LintUseCase](../../../../packages/core/src/application/LintUseCase.ts)

```text
Tag: UserMarkdownlintObsidian.RunModeControl
Need: As a Markdown author, I need to choose whether linting runs while typing or only on save, so feedback matches my tolerance for interruption.
Capability basis: VS Code document events can trigger linting; the core can lint the same text through an extension adapter.
Acceptance cue: An extension setting supports at least `onType` and `onSave` modes, with diagnostics updated according to the selected mode.
```

Source trace:
[extension architecture](../../architecture/overview.md)

```text
Tag: UserMarkdownlintObsidian.VaultAwareFeedback
Need: As an Obsidian vault maintainer, I need link, embed, and block-reference diagnostics to follow the same vault classification that produced OFMarkdown mode, so broken-link feedback matches repository layout.
Capability basis: Flavor Grenade identifies OFMarkdown vault documents; markdownlint-obsidian supports vault root detection, explicit `--vault-root`, wikilink resolution, embed checks, and block-reference indexes.
Acceptance cue: Diagnostics that depend on vault state run for `ofmarkdown` documents, honor detected or configured vault roots, and clearly report when vault resolution is unavailable.
```

Source trace:
[wikilink resolution guide](../../../../docs/guides/wikilink-resolution.md),
[VaultBootstrap](../../../../packages/core/src/application/VaultBootstrap.ts),
[LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts)
