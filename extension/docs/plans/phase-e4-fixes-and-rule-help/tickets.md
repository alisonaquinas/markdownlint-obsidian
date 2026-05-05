# Phase E4 Tickets

## FEAT-005: Quick Fixes, Fix-All, Preview, And Rule Help

Status: `draft`

Goal: expose core-provided fixes and rule docs through VS Code code actions
without becoming a general Markdown formatter.

Linked plan: [Phase E4](../phase-e4-fixes-and-rule-help.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-014` | task | Implement diagnostic code action provider | `open` |
| `TASK-015` | task | Translate core fixes to workspace edits | `open` |
| `TASK-016` | task | Implement fix-all and no-write preview | `open` |
| `TASK-017` | task | Map rule help links | `open` |
| `CHORE-004` | chore | Verify formatting boundary | `open` |

Acceptance criteria:

- [ ] code actions appear only for markdownlint-obsidian diagnostics.
- [ ] edits stay within core-provided fix semantics.
- [ ] stale or invalid fix payloads are rejected.
- [ ] built-in rule docs open correctly.

## TASK-014: Implement Diagnostic Code Action Provider

Scope: register a provider that recognizes markdownlint-obsidian diagnostics
and offers safe quick fixes.

Done when diagnostics from other sources do not produce extension actions.

## TASK-015: Translate Core Fixes To Workspace Edits

Scope: convert one core fix payload into a VS Code edit while preserving
document version and range assumptions.

Done when stale document changes prevent unsafe edits.

## TASK-016: Implement Fix-All And No-Write Preview

Scope: apply non-conflicting safe fixes for the active eligible document and
provide a preview command that never writes files.

Done when conflicting fixes remain unapplied and preview output is read-only.

## TASK-017: Map Rule Help Links

Scope: map OFM, system, and standard Markdown diagnostic codes to packaged docs
targets and degrade gracefully for unknown custom rules.

Done when built-in and unknown rule-code cases are covered.

## CHORE-004: Verify Formatting Boundary

Scope: prove the extension does not silently register unsafe Format Document
behavior.

Done when package contributions and tests match the documented boundary.
