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
