---
title: "Extension Requirements"
aliases:
  - "Extension Requirements"
  - "Requirements / Index"
tags:
  - "extension-docs"
  - "extension-docs/requirements"
  - "requirements"
type: "requirements-index"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Extension Requirements

Requirements for the VS Code extension.

> [!INFO] Requirements map
> Start with [[requirements/user/index]], then [[requirements/functional/index]], then [[requirements/technical/index]] and [[requirements/architecture/index]].

## Requirement Areas

| Area | Purpose |
| :--- | :--- |
| Editing feedback | Show lint diagnostics while users edit OFMarkdown files |
| Fixes | Offer quick fixes and fix-all actions for safe core fixes |
| Workspace commands | Run lint, open config, show output, and reload extension state |
| Configuration | Map VS Code settings to stable core and CLI configuration concepts |
| Workspace trust | Define behavior in trusted, untrusted, local, remote, and virtual workspaces |
| Packaging | Define VSIX contents, build artifacts, and CI checks |
| Testing | Cover activation, diagnostics, fixes, config, and workspace command smoke paths |
| Architecture | Define extension structure, dependency boundaries, and quality gates |
| Technical | Define strict TypeScript, lint, format, package, build, and verification gates |

## User Requirements

User requirements live under [[requirements/user/index]].

| File | Focus |
| :--- | :--- |
| [[requirements/user/editing-feedback]] | Flavor Grenade dependency, activation, document eligibility, current diagnostics, run modes, vault-aware feedback |
| [[requirements/user/fixes-formatting]] | Quick fixes, fix-all, fix-check preview, rule docs, formatting limits |
| [[requirements/user/configuration]] | Config discovery, schema help, custom rules, rule family visibility |
| [[requirements/user/workspace-and-trust]] | Workspace lint, temporary disable, trust, unsupported modes, actionable errors |

## Functional Requirements

Functional requirements live under [[requirements/functional/index]].

| File | Focus |
| :--- | :--- |
| [[requirements/functional/editing-linting]] | Flavor Grenade dependency, activation, eligibility, triggers, config, diagnostics |
| [[requirements/functional/fixes-formatting]] | Code actions, quick fixes, fix-all, fix-check preview, formatting boundary, rule help |
| [[requirements/functional/workspace-commands]] | Workspace lint, config opening, temporary disable, config watchers |
| [[requirements/functional/contributions-and-trust]] | Manifest contributions, schemas, workspace trust, custom rule trust, file-system strategy |
| [[requirements/functional/test-derived]] | Error reporting and metadata consistency |

## Technical Requirements

Technical requirements live under [[requirements/technical/index]].

| File | Focus |
| :--- | :--- |
| [[requirements/technical/typescript-contract]] | Strict TypeScript, NodeNext ESM, typed boundaries, public types |
| [[requirements/technical/lint-format-contract]] | ESLint flat config, no-any and return rules, complexity, formatting, suppressions |
| [[requirements/technical/package-build-contract]] | Bun workspace fit, extension package boundary, build outputs, dependency boundary |
| [[requirements/technical/verification-gates]] | Typecheck, lint, tests, docs, and release gates |

## Architecture Requirements

Architecture requirements live under [[requirements/architecture/index]].
