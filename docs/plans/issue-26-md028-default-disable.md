---
title: "Issue 26: MD028 default-disable plan"
aliases:
  - "Issue 26: MD028 default-disable plan"
tags:
  - "docs"
  - "docs/plans"
  - "docs/plans/phase-work"
type: "plan"
status: "current"
updated: 2026-05-09
up: "[[roadmap]]"
---

# Issue 26: MD028 default-disable plan

## Problem

Issue #26 reports that MD028 (`no-blanks-blockquote`) fires on OFM callouts
unless users manually add this workaround:

```jsonc
{
  "rules": {
    "MD028": { "enabled": false }
  }
}
```

That workaround is important evidence: the standard markdownlint rule adapter
already honors user-supplied rule config. The bug is therefore not missing
feature support or missing rule registration. It is a default-config problem:
MD028 needs to be part of the OFM-aware markdownlint conflict defaults.

## Current source of truth

The authoritative list for markdownlint rules disabled because they conflict
with OFM syntax is:

```text
packages/core/src/infrastructure/rules/standard/OFM_MD_CONFLICTS.ts
```

`DEFAULT_CONFIG.rules` derives its MD-prefix disabled defaults from that list
in:

```text
packages/core/src/infrastructure/config/defaults.ts
```

`StandardRuleAdapter.extractMdConfig` then translates `DEFAULT_CONFIG.rules`
into the upstream markdownlint config object. A default entry of:

```ts
MD028: { enabled: false }
```

must become:

```ts
{ MD028: false }
```

before markdownlint runs.

## Plan of attack

1. Keep MD028 registered as a standard markdownlint rule.

   MD028 should remain in `STANDARD_RULE_DESCRIPTORS` and should still be
   available to users who explicitly re-enable it. The fix is not to remove
   the rule.

2. Add MD028 to `OFM_MD_CONFLICTS`.

   The rationale should say that MD028 conflicts with multi-paragraph OFM
   callout syntax because callouts use blockquote containers and separator
   lines can be required for rendering.

3. Ensure `DEFAULT_CONFIG.rules` is generated from `OFM_MD_CONFLICTS`.

   This keeps one source of truth for all OFM-conflicting MD rules and avoids
   scattering one-off disables in the registry.

4. Preserve deep merge behavior for `rules`.

   User config must be able to override one rule without wiping all default
   OFM conflict disables. For example, enabling MD013 must not silently drop
   the default MD028 disable.

5. Document the conflict.

   Add or update:

   - `docs/rules/standard-md/MD028.md`
   - `docs/rules/standard-md/index.md`
   - BDD callout behavior under `docs/bdd/features/callouts.feature`

6. Add regression coverage at three layers.

   - Default shape: `DEFAULT_CONFIG.rules.MD028.enabled === false`.
   - Adapter translation: `extractMdConfig(DEFAULT_CONFIG).MD028 === false`.
   - End-to-end lint behavior:
     - default config does not emit MD028 for the callout repro;
     - explicit `{ "rules": { "MD028": { "enabled": true } } }` does emit MD028.

## Acceptance criteria

- MD028 is disabled by default through the same conflict-list mechanism as
  other OFM-incompatible MD rules.
- Users can still explicitly re-enable MD028.
- User `rules` overrides do not erase the default MD conflict disables.
- The docs identify `OFM_MD_CONFLICTS.ts` as the single source of truth.
- Regression tests fail before the fix and pass after it.

## Notes

As of the current `origin/develop`, the code already contains the expected
shape: MD028 is present in `OFM_MD_CONFLICTS`, the defaults derive from that
list, and regression coverage exists. This plan records the intended fix path
for traceability and future maintenance.
