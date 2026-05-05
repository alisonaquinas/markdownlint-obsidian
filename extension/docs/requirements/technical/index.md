# Extension Technical Requirements

Technical requirements for implementing the planned VS Code extension in this
repo's strictly linted and type-checked TypeScript style.

These requirements bind the future extension package to the current repository
toolchain unless an explicit ADR changes that baseline.

## Inventory

| File | Tags |
| :--- | :--- |
| [typescript-contract.md](typescript-contract.md) | `MarkdownlintObsidianTechnical.TypeScriptStrictness`, `MarkdownlintObsidianTechnical.NodeNextEsm`, `MarkdownlintObsidianTechnical.TypedBoundaries`, `MarkdownlintObsidianTechnical.PublicTypes` |
| [lint-format-contract.md](lint-format-contract.md) | `MarkdownlintObsidianTechnical.EslintFlatConfig`, `MarkdownlintObsidianTechnical.NoAnyExplicitReturns`, `MarkdownlintObsidianTechnical.ComplexityAndSize`, `MarkdownlintObsidianTechnical.Formatting`, `MarkdownlintObsidianTechnical.Suppressions` |
| [package-build-contract.md](package-build-contract.md) | `MarkdownlintObsidianTechnical.BunWorkspace`, `MarkdownlintObsidianTechnical.ExtensionPackage`, `MarkdownlintObsidianTechnical.BundledLibraryRuntime`, `MarkdownlintObsidianTechnical.BuildOutputs`, `MarkdownlintObsidianTechnical.DependencyBoundary` |
| [verification-gates.md](verification-gates.md) | `MarkdownlintObsidianTechnical.TypecheckGate`, `MarkdownlintObsidianTechnical.LintGate`, `MarkdownlintObsidianTechnical.TestGate`, `MarkdownlintObsidianTechnical.DocsGate`, `MarkdownlintObsidianTechnical.ReleaseGate` |

## Baseline Toolchain

| Concern | Required Baseline |
| :--- | :--- |
| Runtime floor | Node.js `>=20.0.0` |
| Workspace package manager | Bun `>=1.1.30`, root `packageManager` `bun@1.3.12` |
| TypeScript module model | `NodeNext` ESM with explicit runtime-compatible imports |
| Type safety | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns` |
| Linting | ESLint 9 flat config plus `@typescript-eslint` recommended rules |
| Formatting | Prettier 3, checked by root `bun run lint` |
| Tests | Bun tests, Cucumber smoke tests, extension-host tests once extension source exists |
| Docs lint | `markdownlint-obsidian` dogfood checks for root docs and extension docs |

## Source Baseline

- [root package scripts](../../../../package.json)
- [root TypeScript config](../../../../tsconfig.json)
- [build TypeScript config](../../../../tsconfig.build.json)
- [ESLint flat config](../../../../eslint.config.js)
- [type safety architecture](../../../../docs/architecture/type-safety.md)
- [linting and tooling architecture](../../../../docs/architecture/linting-and-tooling.md)

## Interpretation

- These are technical requirements for extension implementation, not claims that
  extension source already exists.
- Existing root package, core package, CLI package, and action package settings
  are the compatibility baseline.
- The extension may add VS Code-specific typings, extension-host tests, and
  bundling config, but must not loosen repository strictness.
