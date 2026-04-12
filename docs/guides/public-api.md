---
title: Public API reference
---

# Public API

The `markdownlint-obsidian/public` subpath exports the types and utilities you need to write custom rules.

## Installation

Your custom rule modules can import from the published subpath:

```typescript
import type { OFMRule, RuleParams, LintError } from 'markdownlint-obsidian/public';
```

## API Surface

The public API includes:

- `OFMRule` — The rule contract interface
- `RuleParams` — Parameters passed to your rule's `onError` callback
- `LintError` — The error object your rule should return
- `Fix` — Describes an automatic fix
- `OnErrorCallback` — Type signature for the `onError` function
- `ParseResult` — The parsed document structure
- Domain value objects (VOs) for reading `parsed.*`

## Type Support

Full TypeScript autocompletion is available when you import from the subpath. See [[guides/custom-rules]] for the authoring guide and worked examples.
