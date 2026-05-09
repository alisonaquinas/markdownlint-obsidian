---
title: "Editor Client Domain Model"
aliases:
  - "Editor Client Domain Model"
  - "DDD / Editor Client / Domain Model"
tags:
  - "extension-docs"
  - "extension-docs/ddd"
  - "extension-docs/ddd/editor-client"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[ddd/bounded-contexts]]"
---

# Editor Client Domain Model

## Purpose

The Editor Client context owns VS Code-facing session state and document
eligibility. It is the boundary between VS Code events and extension domain
decisions.

## Entities

### ExtensionSession

Identity: one VS Code extension activation lifetime.

Owns:

- current temporary-disable state;
- registered disposables;
- observed Flavor Grenade dependency state;
- active diagnostic collection identity.

Invariants:

- one session owns at most one markdownlint-obsidian diagnostic collection;
- temporary disable is not persisted across sessions;
- missing dependency state is reported before automatic live lint falls back.

### ExtensionDependency

Identity: VS Code extension id.

For Flavor Grenade:

- id: `alisonaquinas.flavor-grenade-lsp`;
- expected contribution: `ofmarkdown` language mode;
- role: document classifier, not lint engine.

## Value Objects

| Value Object | Fields | Meaning |
| :--- | :--- | :--- |
| `DependencyState` | `installed`, `enabled`, `active`, `message` | Whether the required dependency can support automatic document selection |
| `DocumentIdentity` | `uri`, `languageId`, `version` | Stable view of a VS Code document for eligibility and stale-result checks |
| `DocumentEligibility` | `eligible`, `reason` | Live-lint decision for a document |

## Domain Services

### DocumentEligibilityPolicy

Inputs:

- `DocumentIdentity`;
- `DependencyState`;
- trust and file-system policy summary.

Decision:

- eligible when `languageId === "ofmarkdown"` and the environment supports the
  selected lint strategy;
- ineligible for generic `markdown` by default;
- ineligible with actionable reason when Flavor Grenade is missing or disabled.

## Domain Events

| Event | Meaning |
| :--- | :--- |
| `FlavorGrenadeDependencyMissing` | Automatic OFMarkdown selection cannot be used |
| `DocumentBecameEligible` | A document entered `ofmarkdown` or otherwise became eligible |
| `DocumentBecameIneligible` | A document left eligibility and diagnostics must clear |
| `TemporaryLintingDisabled` | Session state now suppresses live diagnostics |
| `TemporaryLintingEnabled` | Session state now allows visible eligible documents to re-lint |

## Anti-Corruption Layer

VS Code `TextDocument`, `Extension`, and activation events should be translated
into extension value objects before domain decisions. Extension logic should not
spread raw VS Code API checks across unrelated modules.
