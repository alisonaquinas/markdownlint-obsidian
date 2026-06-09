---
title: "Extension Bounded Contexts"
aliases:
  - "Extension Bounded Contexts"
  - "DDD / Bounded Contexts"
tags:
  - "extension-docs"
  - "extension-docs/ddd"
  - "extension-docs/ddd/bounded-contexts"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[ddd/README]]"
---

# Extension Bounded Contexts

The VS Code extension has five bounded contexts. They are semantic boundaries
inside one extension package, not microservices.

```text
┌───────────────────────┐
│     Editor Client     │
│                       │
│ DependencyState       │
│ DocumentEligibility   │
└───────────┬───────────┘
            │ eligible document event
            ▼
┌───────────────────────┐       ┌───────────────────────┐
│     Lint Feedback     │◀──────│ Configuration & Trust │
│                       │       │                       │
│ DiagnosticProjection  │       │ EffectiveConfig       │
│ RunMode               │       │ TrustPolicy           │
└───────────┬───────────┘       └───────────┬───────────┘
            │ diagnostics with fixes         │ command settings
            ▼                                ▼
┌───────────────────────┐       ┌───────────────────────┐
│     Fix Workflow      │       │  Workspace Commands   │
│                       │       │                       │
│ QuickFix              │       │ WorkspaceLint         │
│ FixAll                │       │ OpenConfig            │
└───────────────────────┘       └───────────────────────┘
```

## Context: Editor Client

**Responsibility:** Own VS Code activation, Flavor Grenade dependency checks,
document eligibility, and extension session lifecycle.

**Owns:** `ExtensionSession`, `DependencyState`, `DocumentEligibility`,
`OFMarkdownDocument` identity.

**Does not own:** lint rule behavior, vault detection, config merge semantics.

**Primary invariant:** automatic live linting only starts for eligible
`ofmarkdown` documents or explicit user command scopes.

## Context: Lint Feedback

**Responsibility:** Convert eligible document content and effective config into
VS Code diagnostics.

**Owns:** `LiveLintRequest`, `DiagnosticProjection`, stale-result suppression,
diagnostic collection lifecycle, run mode.

**Depends on:** Editor Client for eligibility; Configuration and Trust for
effective config; core package for lint results.

**Primary invariant:** visible diagnostics correspond to the latest eligible
document version, effective config, and temporary-disable state.

## Context: Configuration And Trust

**Responsibility:** Resolve extension-visible config and decide which behavior
is allowed in the current workspace mode.

**Owns:** `EffectiveExtensionConfig`, `TrustPolicy`, `CustomRulePermission`,
`FileSystemStrategy`.

**Depends on:** core config loader for `LinterConfig`; VS Code workspace trust
and settings APIs.

**Primary invariant:** custom executable code and file writes are allowed only
when trust and file-system policy permit them.

## Context: Fix Workflow

**Responsibility:** Translate core fix payloads into VS Code edits and preview
results.

**Owns:** `QuickFix`, `FixAllRequest`, `FixPreview`, stale fix rejection,
formatting boundary.

**Depends on:** Lint Feedback for diagnostics; core package for fix semantics.

**Primary invariant:** extension edits never exceed the safe scope described by
core fix payloads and current document state.

## Context: Workspace Commands

**Responsibility:** Handle user-invoked workspace actions: lint workspace, open
config, show output, toggle linting, and refresh diagnostics.

**Owns:** `WorkspaceLintCommand`, `OpenConfigCommand`, output-channel command
reporting, command-level error handling.

**Depends on:** Configuration and Trust for policy; core package for lint and
fix APIs.

**Primary invariant:** commands report either a result or an actionable error.

## Context Map

| Upstream / Peer Context | Relationship | Translation |
| :--- | :--- | :--- |
| Flavor Grenade LSP extension | Customer-supplier | Consumes `ofmarkdown` language identity and dependency state; does not consume Flavor Grenade lint semantics |
| markdownlint-obsidian core | Published language | Consumes public `lint`, `fix`, `LintError`, `LintResult`, `Fix`, and config types |
| VS Code API | Anti-corruption layer | Wraps VS Code documents, diagnostics, commands, settings, and workspace trust in extension-owned concepts |
| CLI package | Shared kernel through core only | Shares core engine behavior, but not process or argument parsing code |
