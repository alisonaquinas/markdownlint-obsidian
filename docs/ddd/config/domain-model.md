# Config Domain Model

## Value Objects

### LinterConfig
Immutable. The fully merged, validated configuration for one LintRun.

```typescript
interface LinterConfig {
  readonly vaultRoot: string;
  readonly resolve: boolean;
  readonly wikilinks: WikilinkConfig;
  readonly callouts: CalloutConfig;
  readonly frontmatter: FrontmatterConfig;
  readonly rules: Readonly<Record<string, RuleConfig>>;
  readonly customRules: readonly string[];
  readonly globs: readonly string[];
  readonly ignores: readonly string[];
  readonly fix: boolean;
  readonly outputFormatters: readonly FormatterConfig[];
}
```

### RuleConfig
Per-rule enable/disable and options.

```typescript
interface RuleConfig {
  readonly enabled: boolean;
  readonly severity?: "error" | "warning";
  readonly options?: Readonly<Record<string, unknown>>;
}
```

## Cascade Logic

Config files are discovered by walking from each file's directory up to vault root.
Closer files take precedence. Precedence order (high → low):

1. CLI `--config` flag
2. `.markdownlint-cli2.jsonc/yaml/cjs/mjs`
3. `.obsidian-linter.jsonc/yaml`
4. `.markdownlint.jsonc/yaml`
5. `package.json#/markdownlint`
6. Built-in defaults
