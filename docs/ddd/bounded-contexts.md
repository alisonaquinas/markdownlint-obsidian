# Bounded Contexts

Three bounded contexts. Dependencies are acyclic and explicit.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Config      │────▶│    Linting      │◀────│      Vault      │
│                 │     │                 │     │                 │
│ LinterConfig    │     │ LintError       │     │ VaultIndex      │
│ RuleConfig      │     │ LintResult      │     │ VaultPath       │
│ ConfigCascade   │     │ Rule            │     │ WikilinkNode    │
│                 │     │ RuleRegistry    │     │ EmbedNode       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       loaded by                uses                  queried by
       LintUseCase          LintUseCase            wikilink rules
```

## Context: Config

**Responsibility:** Discover, merge, and validate configuration files.

**Owns:** `LinterConfig`, `RuleConfig`, cascade logic.

**Does not know about:** vault file contents, rule implementations.

**Public interface:** `ConfigLoader.load(startDir: string): Promise<LinterConfig>`

## Context: Vault

**Responsibility:** Build an index of all vault files and resolve wikilink targets.

**Owns:** `VaultIndex`, `VaultPath`, `VaultDetector`, all `*Node` parse types.

**Does not know about:** rule implementations, config cascade.

**Public interface:** `VaultIndex.resolve(wikilink: WikilinkNode): VaultPath | null`

## Context: Linting

**Responsibility:** Run rules against parsed file content and produce LintErrors.

**Owns:** `LintError`, `LintResult`, `LintRun`, `Rule`, `RuleRegistry`.

**Depends on:** `LinterConfig` (which rules to run), `VaultIndex` (for resolution rules).

**Public interface:** `LintUseCase.run(files: string[], config: LinterConfig): Promise<LintResult[]>`
