# AGENTS.md — Guide for AI Agents Working in `packages/core/src/domain`

Pure domain layer. Contains value objects, interfaces, and algorithms with
zero runtime dependencies on Node.js or any infrastructure library.

## Layout

```text
src/domain/
├── config/
│   ├── LinterConfig.ts      # root config type + per-family option interfaces
│   └── RuleConfig.ts        # per-rule enabled/severity/options envelope
├── fix/
│   └── applyFixes.ts        # conflict-resolution algorithm; sorts and merges Fix[]
├── fs/
│   └── FileExistenceChecker.ts  # interface: (path: string) => boolean | Promise<boolean>
├── linting/
│   ├── Fix.ts               # Fix VO + makeFix factory
│   ├── FixConflict.ts       # FixConflict type (overlapping edits)
│   ├── LintError.ts         # LintError VO + makeLintError factory
│   ├── LintResult.ts        # LintResult VO + makeLintResult factory
│   ├── OFMRule.ts           # OFMRule interface + RuleParams + OnErrorCallback
│   └── RuleRegistry.ts      # in-memory registry: register, lookup, listAll
├── parsing/
│   ├── ParseResult.ts       # aggregate of all extracted OFM nodes + frontmatter
│   ├── SourcePosition.ts    # { line, column } VO
│   ├── WikilinkNode.ts      # { target, alias, anchor, blockRef }
│   ├── EmbedNode.ts         # { target, size }
│   ├── CalloutNode.ts       # { type, foldable, title, body }
│   ├── TagNode.ts           # { value, depth }
│   ├── BlockRefNode.ts      # { id, line }
│   ├── HighlightNode.ts     # { text }
│   └── CommentNode.ts       # { text }
└── vault/
    ├── VaultRoot.ts         # normalized absolute path to vault root
    ├── VaultPath.ts         # vault-relative path VO
    ├── VaultIndex.ts        # interface: all(), has(), resolve()
    ├── BlockRefIndex.ts     # interface: lookup(fileRelative, blockId)
    ├── VaultDetector.ts     # interface: detect(startPath) => VaultRoot | null
    └── WikilinkMatcher.ts   # resolve() algorithm + MatchResult type
```

## Workflows

### Adding a new node type

1. Create the VO file in `parsing/` (e.g., `FootnoteNode.ts`).
2. Add the array field to `ParseResult.ts`.
3. Add an extractor in
   `../../infrastructure/parser/ofm/<Name>Extractor.ts`.
4. Wire the extractor into `MarkdownItParser`.
5. Export the new type from `../../public/index.ts` if it is part of the
   custom rule API.

### Adding a domain interface

Keep the interface in `domain/` and the implementation in `infrastructure/`.
Do not create concrete classes here — only types and pure functions.

## Invariants — Do Not Violate

- No `import` from `../../infrastructure/`, `../../application/`, or
  any npm package that performs I/O.
- Value objects are readonly and constructed via factory functions
  (`makeLintError`, `makeFix`, etc.). Do not add mutating methods.
- `FileExistenceChecker` is an interface — never import from Node.js `fs`
  here. Infrastructure supplies the real implementation.
- `ParseResult` fields are all `readonly`. Rules must not mutate them.

## See Also

- [packages/core AGENTS.md](../../AGENTS.md)
- [Root AGENTS.md](../../../../AGENTS.md)
- [CONCEPTS.md](../../../../CONCEPTS.md)
