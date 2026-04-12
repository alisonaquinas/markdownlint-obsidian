---
rule-code: CUSTOM001
rule-name: require-frontmatter-status
severity: error
fixable: false
area: custom (example)
---

# CUSTOM001 - require-frontmatter-status

**Severity:** error  
**Fixable:** no  
**Added in:** Phase 10 (example)

## What it does

Requires every note to declare a `status` frontmatter key whose value is one
of: `draft`, `review`, `published`, `archived`.

## Bad example

```markdown
---
title: My Note
---
Body text.
```

## Good example

```markdown
---
title: My Note
status: draft
---
Body text.
```

## Source

`examples/rules/require-frontmatter-status.ts`

See [[guides/custom-rules]] for how to adapt this pattern.
