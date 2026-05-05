# Phase E7 Tickets

## FEAT-008: Marketplace Readiness And Release Decision

Status: `draft`

Goal: prepare release metadata, validation evidence, privacy posture, and final
go or no-go checklist for Marketplace publication.

Linked plan: [Phase E7](../phase-e7-hardening-and-marketplace.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-027` | task | Add Marketplace README and assets | `open` |
| `TASK-028` | task | Document Flavor Grenade dependency support | `open` |
| `TASK-029` | task | Complete manual validation matrix | `open` |
| `TASK-030` | task | Finalize release checklist | `open` |
| `SPIKE-002` | spike | Decide telemetry and privacy posture | `open` |
| `CHORE-006` | chore | Verify licenses, notices, and bundled assets | `open` |

Acceptance criteria:

- [ ] Marketplace metadata explains scope, dependency, commands, settings,
  fixes, trust behavior, and limitations.
- [ ] manual validation has recorded results.
- [ ] telemetry posture is explicit.
- [ ] release checklist supports publish or intentional deferral.

## TASK-027: Add Marketplace README And Assets

Scope: create extension-facing README content, icon metadata, categories,
keywords, repository links, issue links, and changelog references.

Done when package metadata and README content agree.

## TASK-028: Document Flavor Grenade Dependency Support

Scope: explain dependency installation, `ofmarkdown` classification, missing or
disabled dependency behavior, and troubleshooting.

Done when manifest, README, and output messages tell the same story.

## TASK-029: Complete Manual Validation Matrix

Scope: run trusted local vault, generic Markdown, missing Flavor Grenade,
untrusted, config-heavy, unsupported workspace, test release tag, and release
tag checks.

Done when results and known limitations are recorded.

## TASK-030: Finalize Release Checklist

Scope: document `ext-v*` and `ext-v*...-test*` tag behavior, publisher
environment checks, checksum verification, and provenance retention.

Done when maintainers can follow the checklist without reading workflow YAML.

## SPIKE-002: Decide Telemetry And Privacy Posture

Question: should the extension ship with telemetry disabled, absent, or
explicit opt-in, given lint diagnostics can expose vault metadata?

Expected output: privacy decision doc, README section, or ADR.

## CHORE-006: Verify Licenses, Notices, And Bundled Assets

Scope: review bundled dependencies, generated assets, license references, and
Marketplace asset ownership.

Done when release metadata has no unresolved legal or packaging gaps.
