---
title: "Bounded Contexts"
aliases:
  - "Bounded Contexts"
tags:
  - "docs"
  - "docs/ddd"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Bounded Contexts

Three bounded contexts. Dependencies are acyclic and explicit.

> [!INFO] Domain map
> Read this with [[ddd/ubiquitous-language]], [[ddd/config/domain-model]], [[ddd/linting/domain-model]], and [[ddd/vault/domain-model]].

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Config      │────▶│    Linting      │◀────│      Vault      │
│                 │     │                 │     │                 │
│ LinterConfig    │     │ LintError       │     │ VaultIndex      │
│ RuleConfig      │     │ LintResult      │     │ VaultPath       │
│ ConfigCascade   │     │ Rule            │     │ WikilinkNode    │
│                 │     │ RuleRegistry    │     │ EmbedNode       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       loaded by                uses                  queried by
       LintUseCase          LintUseCase            wikilink rules
```

## Context: Config

**Responsibility:** Discover, merge, and validate configuration files.

**Owns:** `LinterConfig`, `RuleConfig`, cascade logic, standard MD conflict
defaults.

**Does not know about:** vault file contents, rule implementations.

**Public interface:** `ConfigLoader.load(startDir: string): Promise<LinterConfig>`

## Context: Vault

**Responsibility:** Build an index of all vault files and resolve wikilink targets
using the configured wikilink resolution mode.

**Owns:** `VaultIndex`, `VaultPath`, `VaultDetector`, all `*Node` parse types.

**Does not know about:** rule implementations, config cascade.

**Public interface:** `VaultIndex.resolve(wikilink: Pick<WikilinkNode, "target">): MatchResult`

## Context: Linting

**Responsibility:** Run rules against parsed file content and produce LintErrors.

**Owns:** `LintError`, `LintResult`, `LintRun`, `Rule`, `RuleRegistry`.

**Depends on:** `LinterConfig` (which rules to run), `VaultIndex` (for resolution rules).

Standard markdownlint rules are represented as registry rules too. The linting
context honors config activation, so OFM-conflicting MD rules can remain
registered while defaults suppress them.

**Public interface:** `LintUseCase.run(files: string[], config: LinterConfig): Promise<LintResult[]>`
