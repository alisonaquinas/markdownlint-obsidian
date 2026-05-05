# Lint And Format Contract

## MarkdownlintObsidianTechnical.EslintFlatConfig

```text
Tag: MarkdownlintObsidianTechnical.EslintFlatConfig
Gist: Extension source must be linted by the root ESLint flat config.
Ambition: Extension TypeScript follows the same lint rules as core, CLI, and BDD step code.
Scale: Percentage of extension TypeScript files included in root `eslint .` without broad ignore patterns.
Meter: Root `bun run lint` plus inspection of `eslint.config.js` ignore entries and per-file overrides.
Fail: Extension source is excluded from root ESLint, uses a divergent config without an ADR, or hides violations through broad overrides.
Goal: 100% of extension TypeScript source is checked by the root lint command.
Stakeholders: Extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root ESLint config](../../../../eslint.config.js); [linting and tooling architecture](../../../../docs/architecture/linting-and-tooling.md).
```

Architecture trace: [ExtensionArchitecture.Tooling](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.NoAnyExplicitReturns

```text
Tag: MarkdownlintObsidianTechnical.NoAnyExplicitReturns
Gist: Disallow explicit `any` and require explicit function return types.
Ambition: Extension behavior remains readable at API boundaries and avoids untracked type escape hatches.
Scale: Percentage of extension TypeScript functions and declarations satisfying `@typescript-eslint/no-explicit-any` and `@typescript-eslint/explicit-function-return-type`.
Meter: ESLint run over extension source and tests, with targeted review of boundary adapters and test helpers.
Fail: Any extension source uses explicit `any`, omits a function return type, or adds a rule suppression without a specific reason.
Goal: 100% lint compliance for explicit-any and explicit-return rules.
Stakeholders: Extension maintainers, reviewers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root ESLint config](../../../../eslint.config.js); [type safety architecture](../../../../docs/architecture/type-safety.md).
```

Architecture trace: [ExtensionArchitecture.TypeSafety](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.ComplexityAndSize

```text
Tag: MarkdownlintObsidianTechnical.ComplexityAndSize
Gist: Keep extension modules small enough for review.
Ambition: Activation, diagnostics, fixes, config, commands, and dependency checks stay coherent and independently testable.
Scale: Percentage of extension TypeScript files and functions within root lint limits: cyclomatic complexity at or below 7, preferred file length at or below 200 lines, and preferred function length at or below 30 lines.
Meter: ESLint `complexity`, `max-lines`, and `max-lines-per-function` output, plus source review for justified overrides.
Fail: Extension modules exceed complexity limits, grow into mixed-concern files, or use size overrides without documenting the composition role.
Goal: 100% of production extension modules meet complexity limits or carry a narrow documented exception.
Stakeholders: Extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root ESLint config](../../../../eslint.config.js); [namespace and module structure](../../../../docs/architecture/namespace-and-module-structure.md).
```

Architecture trace: [ExtensionArchitecture.Coherence](../architecture/structure.md)

## MarkdownlintObsidianTechnical.Formatting

```text
Tag: MarkdownlintObsidianTechnical.Formatting
Gist: Extension files must be formatted by the repository Prettier gate.
Ambition: Formatting is mechanical and never distracts from behavior review.
Scale: Percentage of extension source, tests, manifest files, and docs covered by the appropriate formatting or docs-lint command.
Meter: Root `bun run lint`, including `prettier --check .`, and extension docs lint.
Fail: Extension changes require manual formatting review, bypass Prettier, or introduce docs formatting violations.
Goal: 100% of extension-owned text files pass repository formatting and docs-lint gates.
Stakeholders: Extension maintainers, reviewers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root package scripts](../../../../package.json); [linting and tooling architecture](../../../../docs/architecture/linting-and-tooling.md).
```

Architecture trace: [ExtensionArchitecture.Tooling](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.Suppressions

```text
Tag: MarkdownlintObsidianTechnical.Suppressions
Gist: Technical suppressions must be narrow and justified.
Ambition: Type and lint exceptions remain visible design decisions, not hidden drift.
Scale: Percentage of `eslint-disable`, `@ts-expect-error`, coverage ignore, and rule override uses that include the rule id and a concrete reason.
Meter: Source review and optional suppression-audit script over extension source and tests.
Fail: Any bare suppression appears in extension code, or an override covers a whole directory without a documented technical reason.
Goal: 100% of suppressions are specific, reasoned, and reviewable.
Stakeholders: Extension maintainers, reviewers.
Owner: markdownlint-obsidian VS Code extension.
Source: [linting and tooling architecture](../../../../docs/architecture/linting-and-tooling.md); [type safety architecture](../../../../docs/architecture/type-safety.md).
```

Architecture trace: [ExtensionArchitecture.Tooling](../architecture/quality-gates.md)
