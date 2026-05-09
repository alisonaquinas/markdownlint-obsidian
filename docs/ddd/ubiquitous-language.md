---
title: "Ubiquitous Language"
aliases:
  - "Ubiquitous Language"
tags:
  - "docs"
  - "docs/ddd"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[ddd/bounded-contexts]]"
---

# Ubiquitous Language

Canonical terms for the `markdownlint-obsidian` domain. All code, docs, and BDD scenarios use these exact names.

## Linting Bounded Context

| Term | Definition |
|---|---|
| **LintError** | A single rule violation: error code, line, column, message, severity |
| **LintResult** | The complete set of LintErrors for one file |
| **LintRun** | A full execution: file set + config → aggregated LintResults |
| **Rule** | A named, versioned unit of validation logic (OFM001, MD001, etc.) |
| **RuleRegistry** | The ordered collection of active Rules for a given LintRun |
| **StandardRuleAdapter** | The infrastructure wrapper that exposes one upstream markdownlint `MDxxx` rule through the OFM rule contract |
| **Severity** | `error` (fails CI) or `warning` (reported but does not fail) |
| **Fixable** | A Rule that can automatically repair its violation in-place |
| **Fix** | A single-line, column-based text edit with non-negative `deleteCount` |
| **UnrepresentableFix** | A fix payload from an upstream rule that cannot be expressed as a `Fix`; the violation is reported without an attached fix |

## Vault Bounded Context

| Term | Definition |
|---|---|
| **Vault** | An Obsidian workspace — a directory tree rooted at a folder containing `.obsidian/` |
| **VaultRoot** | The absolute path to the vault's root directory |
| **VaultIndex** | An in-memory map of all `.md` files in the vault, keyed by normalized path |
| **Wikilink** | An Obsidian internal link: `[[target]]`, `[[target\|alias]]`, `[[target#heading]]` |
| **Embed** | An Obsidian file transclusion: `![[file]]`, `![[file\|width]]` |
| **BlockRef** | A block-level anchor (`^blockid`) or reference (`[[page#^blockid]]`) |
| **Callout** | An Obsidian admonition block: `> [!TYPE] Title` |
| **Resolution** | The process of matching a Wikilink target to an actual file in the VaultIndex |
| **ResolveMode** | The configured wikilink matching strategy: `path-relative` or `obsidian-fuzzy` |
| **PathSuffixMatch** | An `obsidian-fuzzy` resolution step where a path-like target matches trailing path segments, such as `[[sources/foo]]` resolving to `wiki/sources/foo.md` |

## Config Bounded Context

| Term | Definition |
|---|---|
| **LinterConfig** | The fully merged, validated configuration for a LintRun |
| **ConfigCascade** | The ordered search from a file's directory up to vault root for config files |
| **RuleConfig** | Per-rule enable/disable flag and options object |
| **Standard MD Conflict** | A standard markdownlint rule whose upstream behavior collides with OFM syntax and is disabled by default while remaining user-reenableable |
| **OFM_MD_CONFLICTS** | The authoritative conflict list used to derive default disabled `MDxxx` rule configs |
| **InlineDisable** | An HTML comment suppressing rules for a region of a file |
