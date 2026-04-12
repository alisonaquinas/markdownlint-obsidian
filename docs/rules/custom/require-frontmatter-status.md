---
title: require-frontmatter-status
---

# require-frontmatter-status

Enforce the presence of a `status` frontmatter key in all documents.

## Example

This custom rule checks that every document has a YAML front matter with a `status` field:

```typescript
import type { OFMRule, LintError, RuleParams } from 'markdownlint-obsidian/public';

export default {
  names: ['require-frontmatter-status'],
  description: 'Enforce a `status` frontmatter key',
  onError: (params: RuleParams): LintError[] => {
    if (!params.parsed.frontmatter) {
      return [{
        code: 'CUSTOM001',
        lineNumber: 1,
        message: 'Missing frontmatter block',
      }];
    }
    
    if (!('status' in params.parsed.frontmatter)) {
      return [{
        code: 'CUSTOM001',
        lineNumber: 1,
        message: 'Missing `status` key in frontmatter',
      }];
    }
    
    return [];
  },
} as OFMRule;
```

## Configuration

Add to your `.markdownlint-obsidian.json`:

```json
{
  "customRules": ["./rules/require-frontmatter-status.ts"]
}
```

See [[guides/custom-rules]] for the full authoring guide.
