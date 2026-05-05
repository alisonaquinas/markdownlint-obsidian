# Fixes And Formatting

```text
Tag: UserMarkdownlintObsidian.QuickFix
Need: As a Markdown author, I need quick fixes for auto-fixable OFM and markdownlint violations, so I can correct one issue from the light bulb.
Capability basis: markdownlint-obsidian `LintError` values can carry a core `Fix` payload for safe line edits.
Acceptance cue: Diagnostics with fix payloads expose a preferred quick fix that applies the same text edit the core fix engine would apply.
```

Source trace:
[autofix guide](../../../../docs/guides/autofix.md),
[Fix](../../../../packages/core/src/domain/linting/Fix.ts),
[applyFixes](../../../../packages/core/src/domain/fix/applyFixes.ts)

```text
Tag: UserMarkdownlintObsidian.FixAllDocument
Need: As a Markdown author, I need one action to apply all safe fixes in the current document, so routine vault cleanup is fast and reviewable.
Capability basis: the core fix pipeline applies safe, non-overlapping fixes and reports conflicts.
Acceptance cue: A document-level fix-all action applies all non-conflicting fixes for the current document and leaves non-fixable diagnostics visible.
```

Source trace:
[FixUseCase](../../../../packages/core/src/application/FixUseCase.ts),
[autofix guide](../../../../docs/guides/autofix.md)

```text
Tag: UserMarkdownlintObsidian.FixCheckPreview
Need: As a repository maintainer, I need to preview whether fixes are needed before rewriting files, so editor workflows can match `--fix-check` CI gates.
Capability basis: the CLI and core fix options support check mode that computes fixes without writing files.
Acceptance cue: The extension can expose a preview or command path that reports files with available fixes without modifying workspace content.
```

Source trace:
[CLI args](../../../../packages/cli/src/args.ts),
[autofix guide](../../../../docs/guides/autofix.md),
[engine fix API](../../../../packages/core/src/engine/index.ts)

```text
Tag: UserMarkdownlintObsidian.RuleHelp
Need: As a Markdown author, I need quick access to OFM and standard markdownlint rule docs from a diagnostic, so I can understand whether to fix, ignore, or configure the rule.
Capability basis: every built-in OFM rule has docs under root `docs/rules/`, and standard markdownlint overrides are cataloged.
Acceptance cue: Diagnostics expose links or actions that open the matching rule documentation when local docs are available.
```

Source trace:
[rule catalog](../../../../docs/rules/index.md),
[standard markdownlint catalog](../../../../docs/rules/standard-md/index.md)

```text
Tag: UserMarkdownlintObsidian.NoUnsafeFormatting
Need: As a Markdown author, I need the extension to avoid pretending lint fixes are a full Markdown formatter, so whole-document formatting does not make surprising changes.
Capability basis: markdownlint-obsidian fixes are explicit rule-provided edits; some upstream whole-line markdownlint fixes are intentionally omitted by the current fix model.
Acceptance cue: The extension only offers formatting integration if it can map the request to safe core fixes, and otherwise exposes fixes through code actions or commands.
```

Source trace:
[autofix guide](../../../../docs/guides/autofix.md),
[Fix](../../../../packages/core/src/domain/linting/Fix.ts)
