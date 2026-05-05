# Verification Gates

## MarkdownlintObsidianTechnical.TypecheckGate

```text
Tag: MarkdownlintObsidianTechnical.TypecheckGate
Gist: Extension TypeScript must pass typecheck before merge.
Ambition: Strict type errors are caught before extension behavior reaches develop.
Scale: Percentage of extension-changing pull requests that run a TypeScript no-emit check covering extension source and tests.
Meter: CI and local `bun run typecheck` output, plus extension package-specific typecheck once the package exists.
Fail: Extension source merges with TypeScript errors, missing project references, or files excluded from the checked project.
Goal: 100% of extension-changing pull requests pass typecheck.
Stakeholders: Extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root package scripts](../../../../package.json); [architecture tooling requirement](../architecture/quality-gates.md).
```

Architecture trace: [ExtensionArchitecture.TypeSafety](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.LintGate

```text
Tag: MarkdownlintObsidianTechnical.LintGate
Gist: Extension code must pass ESLint and Prettier before merge.
Ambition: Lint, complexity, size, return-type, no-any, unused-variable, and formatting rules remain mandatory for extension work.
Scale: Percentage of extension-changing pull requests that pass root `bun run lint`.
Meter: CI and local lint output.
Fail: ESLint or Prettier fails, or extension files are excluded from the root lint command without a documented exception.
Goal: 100% of extension-changing pull requests pass the lint gate.
Stakeholders: Extension maintainers, reviewers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root package scripts](../../../../package.json); [root ESLint config](../../../../eslint.config.js).
```

Architecture trace: [ExtensionArchitecture.Tooling](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.TestGate

```text
Tag: MarkdownlintObsidianTechnical.TestGate
Gist: Extension behavior must have a matching automated test layer.
Ambition: Pure mapping logic is fast to test, and VS Code behavior is verified in an extension-host harness.
Scale: Percentage of extension behavior changes covered by unit, component, BDD, or extension-host integration tests at the appropriate level.
Meter: CI test inventory, root `bun run test`, `bun run test:bdd`, extension package tests, and extension-host smoke tests once available.
Fail: Behavior changes merge without a test that would fail before the production change, or VS Code-only behavior is tested only through plain Node unit tests.
Goal: 100% of non-trivial behavior changes include matching automated tests or a documented exception.
Stakeholders: Extension users, maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [extension test harness requirement](../architecture/vscode-extension-specifics.md); [BDD traceability](../../bdd/traceability.md).
```

Architecture trace: [ExtensionArchitecture.TestHarness](../architecture/vscode-extension-specifics.md)

## MarkdownlintObsidianTechnical.DocsGate

```text
Tag: MarkdownlintObsidianTechnical.DocsGate
Gist: Extension docs must pass markdownlint-obsidian dogfood checks.
Ambition: Extension planning and reference docs stay readable and compatible with repo documentation rules.
Scale: Percentage of extension documentation changes that pass `bun run test:dogfood:extension-docs`.
Meter: Local and CI docs-lint command for extension docs, plus aggregate `bun run test:dogfood`.
Fail: Extension Markdown docs introduce lint violations, broken local references that reviewers can catch, or undocumented public behavior.
Goal: 100% of extension docs changes pass the docs gate.
Stakeholders: Extension maintainers, docs readers.
Owner: markdownlint-obsidian VS Code extension.
Source: [extension docs contributing notes](../../README.md); [documentation policy](../../../../docs/architecture/documentation-policy.md).
```

Architecture trace: [ExtensionArchitecture.Documentation](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.ReleaseGate

```text
Tag: MarkdownlintObsidianTechnical.ReleaseGate
Gist: Extension release candidates must pass the full technical gate set.
Ambition: VSIX artifacts are typechecked, linted, tested, documented, packaged, and smoke-tested before publish.
Scale: Percentage of release candidates with green typecheck, lint, unit tests, BDD smoke tests, docs lint, extension-host smoke tests, package inspection, and metadata checks.
Meter: CI release workflow and local release checklist.
Fail: Any release-candidate gate fails, is skipped without documented approval, or packages unverified artifacts.
Goal: 100% of release candidates pass every required technical gate.
Stakeholders: Extension users, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root package scripts](../../../../package.json); [extension metadata requirement](../functional/test-derived.md); [extension package requirement](../architecture/vscode-extension-specifics.md).
```

Functional trace: `MarkdownlintObsidian.MetadataConsistency`
