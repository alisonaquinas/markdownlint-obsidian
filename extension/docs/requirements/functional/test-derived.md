# Test-Derived Requirements

## MarkdownlintObsidian.ErrorReporting

```text
Tag: MarkdownlintObsidian.ErrorReporting
Gist: Report lint, config, custom rule, vault, and fix failures in actionable extension output.
Ambition: Users can diagnose why diagnostics or commands failed without guessing.
Scale: Percentage of supported failure shapes that produce deterministic output containing context, message, rule or system code when available, and affected file or workspace when available.
Meter: Unit and integration tests covering thrown `Error`, non-Error thrown values, config validation errors, custom rule load failures, duplicate custom rules, vault bootstrap failures, parser system diagnostics, fix conflicts, missing Flavor Grenade dependency, and workspace command failures.
Fail: A covered failure is swallowed, shown only in developer console, lacks actionable context, or produces inconsistent output across repeated runs.
Goal: 100% of covered failure shapes produce deterministic user-visible output.
Stakeholders: Markdown authors, repository maintainers, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [system rule catalog](../../../../docs/rules/index.md#system-ofm900ofm999); [ActionableErrors user requirement](../user/workspace-and-trust.md).
```

User trace: [UserMarkdownlintObsidian.ActionableErrors](../user/workspace-and-trust.md)

## MarkdownlintObsidian.MetadataConsistency

```text
Tag: MarkdownlintObsidian.MetadataConsistency
Gist: Keep extension metadata consistent with the bundled or declared markdownlint-obsidian engine.
Ambition: Published extension UI, docs, changelog, schema path, and rule links describe the rule behavior actually running.
Scale: Percentage of checked metadata references that match the extension package version, bundled or declared `markdownlint-obsidian` version, schema path, rule docs, and changelog entry.
Meter: Node unit test reading extension `package.json`, extension README, extension changelog if present, generated schemas, root rule docs, and installed package metadata.
Fail: Any checked version, schema path, rule-doc, or changelog reference differs from the package actually bundled or declared by the extension.
Goal: 100% of checked metadata references match expected package and docs versions.
Stakeholders: Extension users, maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [MetadataConfidence user requirement](../user/workspace-and-trust.md); [public API guide](../../../../docs/guides/public-api.md).
```

User trace: [UserMarkdownlintObsidian.MetadataConfidence](../user/workspace-and-trust.md)
