---
title: Custom rules authoring guide
---

# Custom Rules

Custom rules allow you to extend `markdownlint-obsidian` with your own linting checks. See [[guides/public-api]] for the full API surface and type definitions.

## Getting Started

Create a custom rule module that exports an `OFMRule` object or array:

```typescript
import type { OFMRule, RuleParams, OnErrorCallback } from 'markdownlint-obsidian/api';

export default {
  names: ['your-rule-name'],
  description: 'Your rule description',
  tags: ['custom'],
  severity: 'warning',
  fixable: false,
  run({ parsed, config }: RuleParams, onError: OnErrorCallback): void {
    // Your linting logic here
    // Call onError once per violation:
    // onError({ line, column, message });
  },
} satisfies OFMRule;
```

## Reading ParseResult

The `parsed` object passed to `run` is a `ParseResult` with the following fields:

| Field              | Type                        | Description                                        |
| ------------------ | --------------------------- | -------------------------------------------------- |
| `filePath`         | `string`                    | Absolute path of the file being linted             |
| `frontmatter`      | `Record<string, unknown>`   | Parsed YAML frontmatter key/value pairs            |
| `frontmatterRaw`   | `string \| null`            | Raw frontmatter string (between `---` fences)      |
| `frontmatterEndLine` | `number`                  | 1-based line number where frontmatter ends; 0 if none |
| `wikilinks`        | `readonly WikilinkNode[]`   | All `[[wikilink]]` nodes found in the file         |
| `embeds`           | `readonly EmbedNode[]`      | All `![[embed]]` nodes found in the file           |
| `tags`             | `readonly TagNode[]`        | All `#tag` nodes found in the file                 |
| `blockRefs`        | `readonly BlockRefNode[]`   | All `^block-id` nodes found in the file            |
| `highlights`       | `readonly HighlightNode[]`  | All `==highlight==` nodes found in the file        |
| `comments`         | `readonly CommentNode[]`    | All `%%comment%%` nodes found in the file          |
| `callouts`         | `readonly CalloutNode[]`    | All `> [!type]` callout nodes found in the file    |
| `lines`            | `readonly string[]`         | All lines of the file (1-indexed via `lines[line - 1]`) |
| `raw`              | `string`                    | Full raw file content                              |

Example — iterate over wikilinks:

```typescript
run({ parsed }: RuleParams, onError: OnErrorCallback): void {
  for (const wikilink of parsed.wikilinks) {
    if (wikilink.target.startsWith('http')) {
      onError({
        line: wikilink.position.line,
        column: wikilink.position.column,
        message: `Wikilink target looks like a URL: "${wikilink.target}"`,
      });
    }
  }
},
```

## Reading rule config

`params.config` is the full `LinterConfig` for the current run. Rules can
read standard config properties or configure themselves via a factory function.

**Reading a standard config key:**

```ts
run({ config }, onError) {
  if (!config.resolve) return; // vault resolution disabled — skip cross-file checks
}
```

**Config-driven rule via factory function** (recommended for configurable rules):

```ts
import type { OFMRule } from 'markdownlint-obsidian/api';

function makeBannedTargetsRule(banned: readonly string[]): OFMRule {
  const bannedSet = new Set(banned);
  return {
    names: ["CUSTOM002", "banned-wikilink-targets"],
    description: "Disallow wikilinks to banned target paths",
    tags: ["custom", "wikilinks"],
    severity: "error",
    fixable: false,
    run({ parsed }, onError) {
      for (const link of parsed.wikilinks) {
        if (bannedSet.has(link.target)) {
          onError({
            line: link.position.line,
            column: link.position.column,
            message: `Wikilink target "${link.target}" is banned`,
          });
        }
      }
    },
  };
}

export default makeBannedTargetsRule(["wiki/deprecated", "drafts/private"]);
```

The factory approach keeps the rule pure and makes the banned set trivially testable.

## Emitting a Fix

If your rule can automatically correct violations, set `fixable: true` and include a `fix` payload with each `onError` call. Use `makeFix` to construct a validated, frozen fix:

```typescript
import type { OFMRule, RuleParams, OnErrorCallback } from 'markdownlint-obsidian/api';
import { makeFix } from 'markdownlint-obsidian/api';

export default {
  names: ['trim-trailing-space'],
  description: 'Lines must not have trailing spaces',
  tags: ['whitespace'],
  severity: 'warning',
  fixable: true,
  run({ parsed }: RuleParams, onError: OnErrorCallback): void {
    parsed.lines.forEach((lineText, idx) => {
      const trailingSpaces = lineText.match(/\s+$/);
      if (trailingSpaces) {
        const lineNumber = idx + 1; // lines are 1-based
        const editColumn = lineText.length - trailingSpaces[0].length + 1;
        onError({
          line: lineNumber,
          column: editColumn,
          message: `Trailing whitespace (${trailingSpaces[0].length} chars)`,
          fix: makeFix({
            lineNumber,
            editColumn,
            deleteCount: trailingSpaces[0].length,
            insertText: '',
          }),
        });
      }
    });
  },
} satisfies OFMRule;
```

`makeFix` fields:

| Field        | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `lineNumber` | `number` | 1-based line number of the edit                      |
| `editColumn` | `number` | 1-based column where the edit begins                 |
| `deleteCount`| `number` | Number of characters to delete (0 for pure insert)   |
| `insertText` | `string` | Text to insert at the edit position (empty to delete) |

## Register via Config

Add your custom rule paths to `.obsidian-linter.jsonc` in your vault root. Paths are resolved relative to the current working directory (the directory from which you run the linter):

```jsonc
{
  "customRules": [
    "./rules/require-frontmatter-status.js",
    "./rules/banned-wikilink-targets.js"
  ]
}
```

## Development Workflow

### TypeScript / tsx (dev)

During development you can reference the rule source directly using `tsx`:

```bash
# Lint with tsx so TypeScript source is executed directly
node --import tsx /path/to/bin/markdownlint-obsidian.js "**/*.md"
```

Your config can point at `.ts` source files while using `tsx`:

```jsonc
{
  "customRules": [
    "./rules/require-frontmatter-status.ts"
  ]
}
```

### Production Compilation

For production, compile your rules to JavaScript first:

```bash
tsc --module nodenext --outDir dist/rules src/rules/*.ts
```

Then update your config to reference the compiled output:

```jsonc
{
  "customRules": [
    "./dist/rules/require-frontmatter-status.js"
  ]
}
```

## Examples

See the worked examples:

- [[rules/custom/require-frontmatter-status]]
- [[rules/custom/banned-wikilink-targets]]
