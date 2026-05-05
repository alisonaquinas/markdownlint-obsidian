# Editing Feedback

```text
Tag: UserMarkdownlintObsidian.AutomaticActivation
Need: As a Markdown author, I need Obsidian-aware linting to become available automatically when I open or edit a Markdown document, so I do not have to run the CLI while writing.
Capability basis: VS Code can activate on Markdown documents; markdownlint-obsidian exposes core lint APIs and a CLI for Markdown globs.
Acceptance cue: Opening a VS Code `markdown` document activates extension commands and diagnostics without a manual startup step.
```

Source trace:
[extension architecture](../../architecture/overview.md),
[core public API](../../../../docs/guides/public-api.md),
[CLI args](../../../../packages/cli/src/args.ts)

```text
Tag: UserMarkdownlintObsidian.OFMRelevantDocuments
Need: As a Markdown author, I need linting to target Markdown and Obsidian Flavored Markdown content, so unrelated document types are not noisy.
Capability basis: markdownlint-obsidian discovers Markdown files through globs and parses OFM syntax inside `.md` files.
Acceptance cue: Markdown documents are eligible; non-Markdown language ids are ignored unless a future OFM-specific language mode explicitly opts them in.
```

Source trace:
[rule catalog](../../../../docs/rules/index.md),
[file discovery and lint API](../../../../packages/core/src/engine/index.ts)

```text
Tag: UserMarkdownlintObsidian.CurrentDiagnostics
Need: As a Markdown author, I need diagnostics to reflect the current document content and configuration, so editor underlines and the Problems panel match what the CLI would report.
Capability basis: core lint results expose file, line, column, rule code, severity, message, and fix metadata.
Acceptance cue: Opening, editing, saving, closing, or changing relevant settings updates or clears diagnostics for affected Markdown documents.
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
Need: As an Obsidian vault maintainer, I need link, embed, and block-reference diagnostics to use the correct vault root, so broken-link feedback matches repository layout.
Capability basis: markdownlint-obsidian supports vault root detection, explicit `--vault-root`, wikilink resolution, embed checks, and block-reference indexes.
Acceptance cue: Diagnostics that depend on vault state honor detected or configured vault roots and clearly report when vault resolution is unavailable.
```

Source trace:
[wikilink resolution guide](../../../../docs/guides/wikilink-resolution.md),
[VaultBootstrap](../../../../packages/core/src/application/VaultBootstrap.ts),
[LinterConfig](../../../../packages/core/src/domain/config/LinterConfig.ts)
