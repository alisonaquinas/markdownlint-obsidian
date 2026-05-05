# Lint Feedback Domain Model

## Purpose

The Lint Feedback context owns live diagnostics for eligible OFMarkdown
documents. It translates core lint results into VS Code diagnostic state.

## Entities

### DiagnosticState

Identity: document URI.

Owns:

- latest linted document version;
- effective config fingerprint if available;
- current diagnostic projections;
- stale or suppressed state.

Invariants:

- diagnostics are visible only for eligible documents;
- diagnostics belong to the latest accepted lint result;
- diagnostics clear when the document closes, becomes ineligible, or live
  linting is temporarily disabled.

## Value Objects

| Value Object | Fields | Meaning |
| :--- | :--- | :--- |
| `LiveLintRequest` | document identity, text snapshot, effective config, trigger | One requested live lint operation |
| `DiagnosticProjection` | range, severity, source, code, message, optional fix metadata | VS Code-facing representation of one core `LintError` |
| `RunMode` | `onType` or `onSave` | Event policy for live linting |
| `LintTrigger` | open, change, save, config change, language change, manual refresh | Why linting was requested |

## Domain Services

### LiveLintCoordinator

Coordinates eligible document events, run mode, temporary-disable state, and
core lint execution.

### DiagnosticMapper

Maps core `LintError` values to `DiagnosticProjection` values.

Mapping rules:

- preserve rule code and message;
- map core severity to VS Code severity;
- convert 1-based core line and column positions to VS Code ranges;
- attach fix metadata only when core supplied a safe `Fix`;
- preserve system and custom rule codes.

### StaleResultGuard

Rejects lint results that no longer match the active document identity,
eligibility, or config state.

## Domain Events

| Event | Meaning |
| :--- | :--- |
| `LiveLintRequested` | A document lifecycle event requested lint feedback |
| `DiagnosticsPublished` | Current diagnostics were projected into VS Code |
| `DiagnosticsCleared` | Diagnostics were removed because state changed |
| `LintResultRejectedAsStale` | A completed lint run no longer matches current state |
| `LiveLintFailed` | Core linting or config resolution failed and output should report why |

## Context Boundary

Lint Feedback consumes `LintResult` and `LintError` as published core language.
It does not inspect parser internals or run rules directly.
