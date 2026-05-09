---
title: "Linting Domain Model"
aliases:
  - "Linting Domain Model"
tags:
  - "docs"
  - "docs/ddd"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[ddd/bounded-contexts]]"
---

# Linting Domain Model

## Value Objects

### LintError

Immutable. Identifies one rule violation in one file.

```typescript
interface LintError {
  readonly ruleCode: string;       // "OFM001"
  readonly ruleName: string;       // "no-broken-wikilinks"
  readonly severity: "error" | "warning";
  readonly line: number;           // 1-based
  readonly column: number;         // 1-based
  readonly message: string;
  readonly fixable: boolean;
  readonly fix?: Fix;              // present when fixable === true
}
```

### Fix

Immutable. A single-line, column-based text edit attached to a `LintError`
when a rule can safely repair the violation.

```typescript
interface Fix {
  readonly lineNumber: number;   // 1-based
  readonly editColumn: number;   // 1-based
  readonly deleteCount: number;  // >= 0
  readonly insertText: string;
}
```

The domain deliberately rejects negative `deleteCount` values. Upstream
markdownlint uses `deleteCount: -1` as a sentinel for deleting an entire line,
including its trailing newline. That operation is not representable in this
column-span model, so the standard-rule adapter drops that fix payload and
still reports the underlying `MDxxx` violation. This prevents unrepresentable
fixes from escaping as `OFM901` internal parser errors.

### LintResult

Immutable. All errors for one file.

```typescript
interface LintResult {
  readonly filePath: string;
  readonly errors: readonly LintError[];
}
```

## Domain Services

### RuleRegistry

Registers and retrieves rules. Validates no duplicate codes.

```typescript
interface RuleRegistry {
  register(rule: OFMRule): void;
  get(code: string): OFMRule | undefined;
  all(): readonly OFMRule[];
}
```

The registry contains both OFM-native rules and wrapped standard markdownlint
rules. A rule can be registered but inactive for a given `LintRun` when
`LinterConfig.rules[code].enabled === false`. OFM-conflicting standard rules
such as MD028 use this model: they stay available for explicit user opt-in, but
the default config suppresses them before markdownlint runs.

## Rule Contract

```typescript
interface OFMRule {
  readonly names: readonly string[];       // ["OFM001", "no-broken-wikilinks"]
  readonly description: string;
  readonly tags: readonly string[];
  readonly severity: "error" | "warning";
  readonly fixable: boolean;
  run(params: RuleParams, onError: OnErrorCallback): void;
}
```
