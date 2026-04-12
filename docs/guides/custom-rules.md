---
title: Custom rules authoring guide
---

# Custom Rules

Custom rules allow you to extend `markdownlint-obsidian` with your own linting checks. See [[guides/public-api]] for the full API surface and type definitions.

## Getting Started

Create a custom rule module that exports an `OFMRule` object or array:

```typescript
import type { OFMRule, LintError, RuleParams } from 'markdownlint-obsidian/public';

export default {
  names: ['your-rule-name'],
  description: 'Your rule description',
  onError: (params: RuleParams): LintError[] => {
    // Your linting logic here
    return [];
  },
} as OFMRule;
```

## Configuration

Add your custom rule to the `customRules` config option in your `.markdownlint-obsidian.json`:

```json
{
  "customRules": [
    "./rules/require-frontmatter-status.ts",
    "./rules/banned-wikilink-targets.ts"
  ]
}
```

## Examples

See the worked examples:
- [[rules/custom/require-frontmatter-status]]
- [[rules/custom/banned-wikilink-targets]]
