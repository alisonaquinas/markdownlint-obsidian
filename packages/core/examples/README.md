# markdownlint-obsidian — Example Custom Rules

Two worked examples that exercise the public rule API.

## `rules/require-frontmatter-status.ts`

Enforces a fixed `status` vocabulary in frontmatter. Demonstrates reading
`parsed.frontmatter`, validating a string value, and emitting a structured
`LintError`.

## `rules/banned-wikilink-targets.ts`

Blocks wikilinks to specific target paths. Demonstrates iterating
`parsed.wikilinks` and surfacing the original `SourcePosition`.

## Running the examples

Compile to `.js` and point your config at the built output:

```bash
npx tsc examples/rules/require-frontmatter-status.ts \
  --module nodenext --target es2022 --outDir examples/rules/dist
```

```jsonc
// .obsidian-linter.jsonc
{ "customRules": ["./examples/rules/dist/require-frontmatter-status.js"] }
```

Or run the linter via `tsx` to load `.ts` files directly (dev only):

```bash
npx tsx packages/cli/bin/markdownlint-obsidian.js "**/*.md"
```
