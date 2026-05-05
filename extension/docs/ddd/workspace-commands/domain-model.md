# Workspace Commands Domain Model

## Purpose

The Workspace Commands context owns user-invoked actions that are broader than
one live document.

## Entities

### CommandRun

Identity: command id plus invocation timestamp.

Owns:

- command kind;
- target workspace folder or active document;
- output channel correlation;
- success or failure result.

Invariants:

- every command reports a result or actionable error;
- commands do not depend on automatic live-lint eligibility unless their
  behavior explicitly says so;
- workspace commands use effective config and trust policy.

## Value Objects

| Value Object | Fields | Meaning |
| :--- | :--- | :--- |
| `WorkspaceLintRequest` | workspace folder, globs, config, vault root | One whole-workspace lint request |
| `OpenConfigRequest` | workspace folder, preferred filename | One request to open or create config |
| `CommandResult` | status, summary, output reference | User-visible command outcome |
| `ActionableError` | message, context, suggested next step | Failure information suitable for output |

## Domain Services

### WorkspaceLintRunner

Runs core lint across workspace files and reports output.

### ConfigOpenPolicy

Finds the nearest supported config file or creates a starter draft.

### OutputReporter

Formats command summaries, errors, and dependency/trust messages for VS Code
output.

## Domain Events

| Event | Meaning |
| :--- | :--- |
| `WorkspaceLintStarted` | A workspace lint command began |
| `WorkspaceLintCompleted` | Workspace lint finished with clean, warning, or error result |
| `ConfigFileOpened` | A supported config file was opened |
| `ConfigDraftCreated` | No config existed, so a starter draft was opened |
| `CommandFailed` | A command failed with actionable context |

## Context Boundary

Workspace Commands consume Configuration and Trust decisions and core lint APIs.
They do not own live diagnostic lifecycle, though they may request a refresh
after command completion.
