# markdownlint-obsidian

Obsidian Flavored Markdown linting engine — programmatic API and rule set.

No CLI dependencies. Use this when you want to drive linting from your own
Node.js or Bun application without pulling in `commander`.

## Install

```bash
npm install markdownlint-obsidian
bun add markdownlint-obsidian
```

Consumers can run the library under Node.js 20+ or Bun 1.1+.

## Programmatic API

```typescript
import { lint, fix, getFormatter } from "markdownlint-obsidian/engine";

// Lint files
const results = await lint({
  globs: ["**/*.md"],
  cwd: process.cwd(),
});

// Fix in place
const outcome = await fix({
  globs: ["**/*.md"],
  cwd: process.cwd(),
});

// Check mode (no writes)
const checkOutcome = await fix({
  globs: ["**/*.md"],
  cwd: process.cwd(),
  check: true,
});

// Format results
const formatter = getFormatter("sarif");
const sarif = formatter(results);
```

## Configuration and formatters

- `loadConfig(cwd)` loads `.obsidian-linter.jsonc` from the working tree and
  applies defaults.
- `getFormatter(name)` returns one of the built-in output adapters:
  `default`, `json`, `junit`, or `sarif`.
- The public rule-authoring surface lives under
  `markdownlint-obsidian/api`; the built-in rule catalog lives under
  `markdownlint-obsidian/rules`.

## Exports

| Sub-path | Contents |
| --- | --- |
| `markdownlint-obsidian` | Public API (same as `/api`) |
| `markdownlint-obsidian/api` | `LinterConfig`, `LintResult`, helpers |
| `markdownlint-obsidian/rules` | Built-in rule definitions |
| `markdownlint-obsidian/engine` | `lint()`, `fix()`, `getFormatter()`, `loadConfig()` |

## Developing in this monorepo

```bash
bun install
cd packages/core
bun test
bun run build
```

See [`src/README.md`](src/README.md) for the layer map and
[`examples/README.md`](examples/README.md) for custom-rule examples.

## License

MIT
