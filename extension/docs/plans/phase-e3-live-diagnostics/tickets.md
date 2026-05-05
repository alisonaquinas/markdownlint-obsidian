# Phase E3 Tickets

## FEAT-004: Live Diagnostics For Eligible OFMarkdown Documents

Status: `draft`

Goal: publish current VS Code diagnostics for visible eligible documents using
latest text, effective config, and bundled library results.

Linked plan: [Phase E3](../phase-e3-live-diagnostics.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-010` | task | Register document event listeners | `open` |
| `TASK-011` | task | Implement lint scheduler and cancellation | `open` |
| `TASK-012` | task | Map lint errors to VS Code diagnostics | `open` |
| `TASK-013` | task | Add extension-host diagnostics smoke tests | `open` |
| `CHORE-003` | chore | Sweep diagnostics output and stale-result docs | `open` |

Acceptance criteria:

- [ ] only eligible `ofmarkdown` documents receive live diagnostics.
- [ ] stale results cannot overwrite newer diagnostics.
- [ ] closed, disabled, or ineligible documents clear diagnostics.
- [ ] no diagnostics path requires the CLI.

## TASK-010: Register Document Event Listeners

Scope: listen for open, change, save, close, visible editor change, language id
change, and config refresh events.

Done when listener registration and disposal are covered by unit or component
tests.

## TASK-011: Implement Lint Scheduler And Cancellation

Scope: model lint requests with URI, version, language id, run mode, config,
and cancellation state.

Done when on-type, on-save, debounce, cancellation, and stale suppression cases
are covered.

## TASK-012: Map Lint Errors To VS Code Diagnostics

Scope: translate bundled library lint errors into VS Code range, severity,
source, code, message, and documentation metadata.

Done when mapper tests cover OFM, system, and standard Markdown rule examples.

## TASK-013: Add Extension-Host Diagnostics Smoke Tests

Scope: open an OFMarkdown fixture and verify activation plus diagnostic
publication in an Extension Development Host.

Done when generic Markdown is skipped and OFMarkdown diagnostics appear.

## CHORE-003: Sweep Diagnostics Output And Stale-Result Docs

Scope: document output-channel message shape and stale-result behavior after
the implementation lands.

Done when docs match observed behavior and the phase gate passes.
