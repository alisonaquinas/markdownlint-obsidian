---
title: "TypeScript Contract"
aliases:
  - "TypeScript Contract"
  - "Requirements / Technical / Typescript Contract"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "extension-docs/requirements/technical"
  - "requirements"
type: "technical-requirement"
status: "current"
updated: 2026-05-09
up: "[[requirements/technical/index]]"
---

# TypeScript Contract

## MarkdownlintObsidianTechnical.TypeScriptStrictness

```text
Tag: MarkdownlintObsidianTechnical.TypeScriptStrictness
Gist: Extension TypeScript must inherit the repository strictness baseline.
Ambition: Extension source is checked with the same strict TypeScript posture as core and CLI code.
Scale: Percentage of extension TypeScript projects that extend or exactly preserve root strict compiler options.
Meter: Inspect extension `tsconfig.json`, build config, and CI typecheck output for `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `forceConsistentCasingInFileNames`.
Fail: Extension config disables or weakens a root strictness flag without an accepted ADR.
Goal: 100% of extension TypeScript configs preserve repository strictness.
Stakeholders: Extension maintainers, core maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root tsconfig](../../../../tsconfig.json); [type safety architecture](../../../../docs/architecture/type-safety.md).
```

Architecture trace: [[requirements/architecture/quality-gates]]

## MarkdownlintObsidianTechnical.NodeNextEsm

```text
Tag: MarkdownlintObsidianTechnical.NodeNextEsm
Gist: Use the repository NodeNext ESM model for extension TypeScript.
Ambition: Extension imports, emitted JavaScript, and bundled entry points remain compatible with repo packages and Node 20.
Scale: Percentage of extension TypeScript compilation units that compile under `module: NodeNext`, `moduleResolution: NodeNext`, `target: ES2022`, and package `type: module`.
Meter: TypeScript build plus source inspection for runtime-compatible import specifiers and package metadata.
Fail: Extension source depends on CommonJS-only authoring patterns, omits required runtime extensions for NodeNext source imports, or changes package type inconsistently.
Goal: 100% of extension source compiles under the repository NodeNext ESM baseline.
Stakeholders: Extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root tsconfig](../../../../tsconfig.json); [root package metadata](../../../../package.json).
```

Architecture trace: [[requirements/architecture/vscode-extension-specifics]]

## MarkdownlintObsidianTechnical.TypedBoundaries

```text
Tag: MarkdownlintObsidianTechnical.TypedBoundaries
Gist: Validate unknown inputs before converting them to extension or core types.
Ambition: VS Code settings, command arguments, JSON/YAML config, dependency state, and core results cross explicit typed adapters.
Scale: Percentage of external-boundary paths that accept `unknown` or SDK-provided shapes, narrow them, and return named extension-domain types.
Meter: Typecheck, ESLint, and unit tests for settings readers, command argument parsing, diagnostic projection, fix translation, schema loading, and dependency checks.
Fail: Extension code casts unvalidated JSON, VS Code command arguments, workspace data, or custom rule input directly into trusted domain types.
Goal: 100% of external-boundary paths validate or narrow input before use.
Stakeholders: Extension users, security-conscious users, maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [type safety architecture](../../../../docs/architecture/type-safety.md); [[requirements/functional/contributions-and-trust]].
```

Functional trace: `MarkdownlintObsidian.SchemaValidation`,
`MarkdownlintObsidian.WorkspaceTrust`, `MarkdownlintObsidian.CustomRuleTrust`

## MarkdownlintObsidianTechnical.PublicTypes

```text
Tag: MarkdownlintObsidianTechnical.PublicTypes
Gist: Keep exported extension-facing types stable and documented.
Ambition: Tests, adapters, and later consumers can rely on named contracts instead of inferred structural accidents.
Scale: Percentage of exported extension modules that expose intentional types with explicit return types and TSDoc where purpose or invariants are not obvious.
Meter: ESLint explicit-return-type rule, TypeScript declaration output if enabled, public API review, and docs review.
Fail: Public extension modules export anonymous object shapes, implicit return types, undocumented non-obvious contracts, or internal VS Code adapter shapes as stable domain types.
Goal: 100% of exported extension-facing contracts are explicit and reviewable.
Stakeholders: Extension maintainers, future integration authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [documentation policy](../../../../docs/architecture/documentation-policy.md); [root ESLint config](../../../../eslint.config.js).
```

Architecture trace: [[requirements/architecture/quality-gates]]
