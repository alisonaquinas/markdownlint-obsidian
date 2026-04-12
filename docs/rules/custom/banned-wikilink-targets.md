---
title: banned-wikilink-targets
---

# banned-wikilink-targets

Block links to specific wikilink targets.

## Example

This custom rule prevents linking to certain sensitive or deprecated pages:

```typescript
import type { OFMRule, LintError, RuleParams } from 'markdownlint-obsidian/public';

const bannedTargets = ['private', 'deprecated', 'internal'];

export default {
  names: ['banned-wikilink-targets'],
  description: 'Block links to specific targets',
  onError: (params: RuleParams): LintError[] => {
    const errors: LintError[] = [];
    
    for (const wikilink of params.parsed.wikilinks) {
      if (bannedTargets.includes(wikilink.target)) {
        errors.push({
          code: 'CUSTOM002',
          lineNumber: wikilink.lineNumber,
          message: `Wikilink to "${wikilink.target}" is not allowed`,
        });
      }
    }
    
    return errors;
  },
} as OFMRule;
```

## Configuration

Add to your `.markdownlint-obsidian.json`:

```json
{
  "customRules": ["./rules/banned-wikilink-targets.ts"]
}
```

See [[guides/custom-rules]] for the full authoring guide.
