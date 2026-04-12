---
title: Public API reference
---

# Public API

The `markdownlint-obsidian/api` subpath exports the types and utilities you need to write custom rules. See [[guides/custom-rules]] for the authoring guide and worked examples.

## Stability Guarantee

This API follows **semver**: additive changes land in minor releases; breaking changes require a major version bump. Anything exported from `markdownlint-obsidian/api` or `markdownlint-obsidian/rules` is considered public and stable. Internal module paths (e.g. `src/domain/...`) are not public and may change at any time.

## Import Subpaths

```typescript
// Rule authoring — OFMRule, RuleParams, OnErrorCallback, Fix, ParseResult, VOs
import type { OFMRule, RuleParams, OnErrorCallback, Fix, ParseResult } from 'markdownlint-obsidian/api';
import { makeFix, makeLintError } from 'markdownlint-obsidian/api';

// Built-in rule list (read-only array of OFMRule)
import { builtinRules } from 'markdownlint-obsidian/rules';
```

For local development before publishing, use the source path directly:

```typescript
import type { OFMRule } from '../../src/public/index.js';
```

## OFMRule Interface

Every rule must satisfy the `OFMRule` interface:

```typescript
interface OFMRule {
  readonly names: readonly string[];       // e.g. ['OFM001', 'no-broken-wikilinks']
  readonly description: string;
  readonly tags: readonly string[];
  readonly severity: 'error' | 'warning';
  readonly fixable: boolean;
  run(params: RuleParams, onError: OnErrorCallback): void | Promise<void>;
}
```

Rules are **stateless and pure** — given the same `RuleParams` they must always emit the same violations. `run` may be `async` (returning `Promise<void>`); the runtime awaits it.

## OnErrorCallback Type

```typescript
type OnErrorCallback = (
  error: { line: number; column: number; message: string; fix?: Fix }
) => void;
```

Rule authors call `onError` once per violation. The runtime automatically fills in `ruleCode`, `ruleName`, `severity`, and `fixable` from the rule's static metadata.

## RuleParams Interface

```typescript
interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
  readonly vault: VaultIndex | null;        // null when config.resolve === false
  readonly fsCheck: FileExistenceChecker;   // always present; stub returns false
  readonly blockRefIndex: BlockRefIndex | null; // null when config.resolve === false
}
```

Rules must not mutate any `RuleParams` fields.

## Fix Interface

```typescript
interface Fix {
  readonly lineNumber: number;   // 1-based
  readonly editColumn: number;   // 1-based
  readonly deleteCount: number;  // >= 0
  readonly insertText: string;
}
```

Use the `makeFix` factory (validates fields and freezes the object):

```typescript
import { makeFix } from 'markdownlint-obsidian/api';

const fix = makeFix({ lineNumber: 3, editColumn: 5, deleteCount: 2, insertText: 'ok' });
```

## Export Categories

### Linting Primitives

| Export | Kind | Description |
| ------ | ---- | ----------- |
| `OFMRule` | type | Rule contract interface |
| `RuleParams` | type | Inputs supplied to `rule.run` |
| `OnErrorCallback` | type | Callback rules invoke per violation |
| `LintError` | type | Immutable violation value object |
| `LintResult` | type | Per-file collection of `LintError` instances |
| `makeLintError` | function | Factory for frozen `LintError` values |
| `makeLintResult` | function | Factory for frozen `LintResult` values |

### Fix Primitives

| Export | Kind | Description |
| ------ | ---- | ----------- |
| `Fix` | type | Atomic text-edit descriptor |
| `makeFix` | function | Validated factory for `Fix` (throws on bad values) |

### ParseResult and Value Objects

| Export | Kind | Description |
| ------ | ---- | ----------- |
| `ParseResult` | type | Fully-parsed file with all OFM node arrays |
| `WikilinkNode` | type | A `[[target\|alias]]` node |
| `EmbedNode` | type | A `![[asset]]` node |
| `CalloutNode` | type | A `> [!type]` callout block |
| `TagNode` | type | A `#tag` node |
| `BlockRefNode` | type | A `^block-id` node |
| `HighlightNode` | type | A `==highlight==` node |
| `CommentNode` | type | A `%%comment%%` node |
| `SourcePosition` | type | `{ line, column }` (1-based) |

### Config Types

| Export | Kind | Description |
| ------ | ---- | ----------- |
| `LinterConfig` | type | Top-level config shape |
| `FrontmatterConfig` | type | `config.frontmatter` sub-config |
| `TagConfig` | type | `config.tags` sub-config |
| `CalloutConfig` | type | `config.callouts` sub-config |
| `WikilinkConfig` | type | `config.wikilinks` sub-config |
| `EmbedConfig` | type | `config.embeds` sub-config |
| `HighlightConfig` | type | `config.highlights` sub-config |
| `CommentConfig` | type | `config.comments` sub-config |
| `BlockRefConfig` | type | `config.blockRefs` sub-config |
| `RuleConfigEntry` | type | Per-rule config entry (`{ enabled, ... }`) |

### Vault Types

| Export | Kind | Description |
| ------ | ---- | ----------- |
| `VaultIndex` | type | Resolved note index for wikilink lookups |
| `VaultPath` | type | Normalized vault-relative path |
| `BlockRefIndex` | type | Cross-file `^block-id` index |
| `MatchResult` | type | Result of a `VaultIndex` wikilink match |
