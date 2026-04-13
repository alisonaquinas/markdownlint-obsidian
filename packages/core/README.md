# markdownlint-obsidian

Obsidian Flavored Markdown linting engine — programmatic API and rule set.

No CLI dependencies. Use this when you want to drive linting from your own
Node.js or Bun application without pulling in `commander`.

## Install

```bash
npm install markdownlint-obsidian
bun add markdownlint-obsidian
```

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

## Exports

| Sub-path | Contents |
| --- | --- |
| `markdownlint-obsidian` | Public API (same as `/api`) |
| `markdownlint-obsidian/api` | `LinterConfig`, `LintResult`, helpers |
| `markdownlint-obsidian/rules` | Built-in rule definitions |
| `markdownlint-obsidian/engine` | `lint()`, `fix()`, `getFormatter()`, `loadConfig()` |

## License

MIT
