---
title: "Fix Workflow Domain Model"
aliases:
  - "Fix Workflow Domain Model"
  - "DDD / Fix Workflow / Domain Model"
tags:
  - "extension-docs"
  - "extension-docs/ddd"
  - "extension-docs/ddd/fix-workflow"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[ddd/bounded-contexts]]"
---

# Fix Workflow Domain Model

## Purpose

The Fix Workflow context owns user-initiated edits derived from core fix
payloads. It protects users from stale, unsafe, or over-broad edits.

## Entities

### FixSession

Identity: command invocation or code-action request.

Owns:

- target document identity;
- requested scope;
- available diagnostic projections;
- computed workspace edit or preview result.

Invariants:

- fixes apply only to the intended document and version;
- no edit is applied when the document is ineligible or stale;
- no extension fix exceeds core `Fix` semantics;
- preview mode never writes files.

## Value Objects

| Value Object | Fields | Meaning |
| :--- | :--- | :--- |
| `FixScope` | diagnostic, document, rule, workspace preview | The requested fix boundary |
| `FixCandidate` | diagnostic projection plus core fix payload | One possible edit |
| `WorkspaceEditPlan` | target URI, version, edits | VS Code-ready edit plan |
| `FixPreviewResult` | files with fixes, conflicts, remaining diagnostics | No-write summary |
| `FixRejection` | reason, diagnostic, target | Why a fix was not offered or applied |

## Domain Services

### QuickFixPlanner

Builds one `WorkspaceEditPlan` from one diagnostic fix payload.

### FixAllPlanner

Builds a document or rule-scoped edit plan using core fix behavior and conflict
information.

### FixPreviewPlanner

Runs no-write fix analysis and returns a `FixPreviewResult`.

### FormattingBoundaryPolicy

Decides whether a VS Code formatting entry point may be exposed. Formatting is
allowed only when it maps to documented core fix semantics.

## Domain Events

| Event | Meaning |
| :--- | :--- |
| `QuickFixOffered` | A diagnostic has a safe single fix |
| `FixAllRequested` | User requested a document or rule-scoped fix-all |
| `FixPreviewComputed` | No-write fix availability was reported |
| `FixRejected` | A stale, invalid, or unsafe fix was blocked |
| `FixesApplied` | VS Code accepted the edit plan |

## Context Boundary

Fix Workflow consumes core `Fix` payloads and fix outcomes. It does not invent
new repairs for diagnostics without core fixes.
