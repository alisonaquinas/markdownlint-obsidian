---
title: "CUSTOM002 - banned-wikilink-targets"
aliases:
  - "CUSTOM002 - banned-wikilink-targets"
tags:
  - "docs"
  - "docs/rules"
  - "docs/rules/custom"
type: "rule-reference"
status: "current"
updated: 2026-05-09
up: "[[rules/index]]"
rule-code: CUSTOM002
rule-name: banned-wikilink-targets
severity: error
fixable: false
area: custom (example)
---

# CUSTOM002 - banned-wikilink-targets

**Severity:** error  
**Fixable:** no  
**Added in:** Phase 10 (example)

## What it does

Blocks wikilinks whose `target` matches a configured denylist. The example
bans `wiki/deprecated` and `drafts/private`.

## Bad example

```markdown
See [[wiki/deprecated]] for details.
```

## Good example

```markdown
See [[current-page]] for details.
```

## Source

`examples/rules/banned-wikilink-targets.ts`

Adapt the `BANNED` set to your vault's needs.
