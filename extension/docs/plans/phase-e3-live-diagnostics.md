# Phase E3: Live Diagnostics

## Goal

Publish VS Code diagnostics for visible eligible `ofmarkdown` documents using
the current document text, effective configuration, and core lint results.

## Scope

- activation for OFMarkdown documents.
- live lint coordinator.
- diagnostic collection lifecycle.
- diagnostic projection.
- run mode: on type and on save.
- stale-result suppression.
- document close, language change, and config refresh handling.

## Behavior Slice

An author opens an Obsidian vault note that Flavor Grenade classifies as
`ofmarkdown`. The extension activates, lints the eligible document, and
publishes diagnostics that match the latest document version.

## Implementation Tasks

- [ ] Register document listeners for open, change, save, close, visible editor
  change, and language-id changes.
- [ ] Create a live lint request model with document URI, version, language id,
  run mode, effective config, and cancellation state.
- [ ] Implement debounce or scheduling policy for on-type linting.
- [ ] Convert core `LintError` values to VS Code diagnostics with correct
  range, severity, source, code, message, and documentation metadata.
- [ ] Clear diagnostics for closed, ineligible, disabled, or stale documents.
- [ ] Add output messages for lint, config, vault, and dependency failures.
- [ ] Add extension-host tests for activation and diagnostic publication.
- [ ] Add component tests for stale-result suppression and mapper behavior.

## Test Plan

| Scenario | Evidence |
| :--- | :--- |
| OFMarkdown activation | opening `ofmarkdown` document activates extension feedback |
| generic Markdown skipped | `markdown` document receives no automatic diagnostics |
| on-type run mode | edit requests a lint and replaces diagnostics |
| on-save run mode | unsaved edit waits, save requests lint |
| stale result | older result cannot overwrite newer diagnostics |
| close or disable | diagnostic collection clears affected document |
| error path | output contains affected document and message |

## Verification

```bash
bun --cwd extension test tests/unit/diagnostics
bun --cwd extension test tests/component/lint-feedback
bun --cwd extension run test:integration -- --grep diagnostics
bun run test:dogfood
```

## Acceptance Criteria

- live linting runs only for eligible `ofmarkdown` documents.
- diagnostics reflect latest text and effective config.
- stale diagnostics do not remain visible.
- run mode controls when lint requests occur.
- output reports actionable failures.
- core rule behavior is not reimplemented in extension source.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| File-based core API cannot lint unsaved text accurately | add or request a public in-memory lint API before broadening live diagnostics |
| Large documents make on-type linting noisy | debounce and cancellation policy; add performance notes before tuning |
| Vault-aware rules need workspace indexes | start with existing core behavior and document any limitations in output |

## Exit Criteria

E3 exits when live diagnostics work in an Extension Development Host for
eligible OFMarkdown documents and pass automated integration coverage.
