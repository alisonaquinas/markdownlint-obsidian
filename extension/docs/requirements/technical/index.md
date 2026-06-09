---
title: "Extension Technical Requirements"
aliases:
  - "Extension Technical Requirements"
  - "Requirements / Technical / Index"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/technical"
  - "requirements"
type: "technical-requirements-index"
status: "current"
updated: 2026-05-09
up: "[[requirements/index]]"
---

# Extension Technical Requirements

Technical requirements for implementing the VS Code extension in this repo's
strictly linted and type-checked TypeScript style.

These requirements bind the extension package to the current repository
toolchain unless an explicit ADR changes that baseline.

## Inventory

| File | Tags |
| :--- | :--- |
| [[requirements/technical/typescript-contract]] | `MarkdownlintObsidianTechnical.TypeScriptStrictness`, `MarkdownlintObsidianTechnical.NodeNextEsm`, `MarkdownlintObsidianTechnical.TypedBoundaries`, `MarkdownlintObsidianTechnical.PublicTypes` |
| [[requirements/technical/lint-format-contract]] | `MarkdownlintObsidianTechnical.EslintFlatConfig`, `MarkdownlintObsidianTechnical.NoAnyExplicitReturns`, `MarkdownlintObsidianTechnical.ComplexityAndSize`, `MarkdownlintObsidianTechnical.Formatting`, `MarkdownlintObsidianTechnical.Suppressions` |
| [[requirements/technical/package-build-contract]] | `MarkdownlintObsidianTechnical.BunWorkspace`, `MarkdownlintObsidianTechnical.ExtensionPackage`, `MarkdownlintObsidianTechnical.BundledLibraryRuntime`, `MarkdownlintObsidianTechnical.BuildOutputs`, `MarkdownlintObsidianTechnical.DependencyBoundary` |
| [[requirements/technical/verification-gates]] | `MarkdownlintObsidianTechnical.TypecheckGate`, `MarkdownlintObsidianTechnical.LintGate`, `MarkdownlintObsidianTechnical.TestGate`, `MarkdownlintObsidianTechnical.DocsGate`, `MarkdownlintObsidianTechnical.ReleaseGate` |

## Baseline Toolchain

| Concern | Required Baseline |
| :--- | :--- |
| Runtime floor | Node.js `>=20.0.0` |
| Workspace package manager | Bun `>=1.1.30`, root `packageManager` `bun@1.3.12` |
| TypeScript module model | `NodeNext` ESM with explicit runtime-compatible imports |
| Type safety | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns` |
| Linting | ESLint 9 flat config plus `@typescript-eslint` recommended rules |
| Formatting | Prettier 3, checked by root `bun run lint` |
| Tests | Bun tests, Cucumber smoke tests, package checks, and extension-host tests |
| Docs lint | `markdownlint-obsidian` dogfood checks for root docs and extension docs |

## Source Baseline

- [root package scripts](../../../../package.json)
- [root TypeScript config](../../../../tsconfig.json)
- [build TypeScript config](../../../../tsconfig.build.json)
- [ESLint flat config](../../../../eslint.config.js)
- [type safety architecture](../../../../docs/architecture/type-safety.md)
- [linting and tooling architecture](../../../../docs/architecture/linting-and-tooling.md)

## Interpretation

- Existing root package, core package, CLI package, action package, and
  extension package settings are the compatibility baseline.
- The extension may add VS Code-specific typings, extension-host tests, and
  bundling config, but must not loosen repository strictness.
