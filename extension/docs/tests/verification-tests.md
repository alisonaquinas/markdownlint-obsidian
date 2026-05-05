# Verification Test Plan

Verification tests prove that extension code is technically acceptable for this
repository: strictly typed, linted, formatted, packaged, and documented.

## Required Gates

| Gate | Root Command | Extension Command | Requirement Trace |
| :--- | :--- | :--- | :--- |
| Typecheck | `bun run typecheck` | `bun --cwd extension run typecheck` | `MarkdownlintObsidianTechnical.TypecheckGate` |
| Lint and format | `bun run lint` | `bun --cwd extension run lint` | `MarkdownlintObsidianTechnical.LintGate` |
| Unit tests | `bun run test` | `bun --cwd extension test` | `MarkdownlintObsidianTechnical.TestGate` |
| BDD smoke | `bun run test:bdd` | extension-host scenarios or tagged BDD smoke | `MarkdownlintObsidianTechnical.TestGate` |
| Extension docs lint | `bun run test:dogfood:extension-docs` | same | `MarkdownlintObsidianTechnical.DocsGate` |
| Build | `bun run build` | `bun --cwd extension run build` | `MarkdownlintObsidianTechnical.ReleaseGate` |
| Package inspection | `bun extension/docs/tests/scripts/run-verification-gates.mjs` | `bun --cwd extension run package:check` | `MarkdownlintObsidianTechnical.ReleaseGate` |

## Manifest Verification

Automated checks inspect:

- `extensionDependencies` includes `alisonaquinas.flavor-grenade-lsp`;
- activation includes OFMarkdown behavior, such as `onLanguage:ofmarkdown`;
- contributed commands match functional requirements;
- configuration properties preserve documented defaults and scopes;
- schema contributions cover supported linter config filenames;
- extension capabilities declare workspace trust and virtual workspace posture;
- package entry points point to generated build output.

## TypeScript Verification

The extension TypeScript project must preserve:

- `strict`;
- `noUncheckedIndexedAccess`;
- `exactOptionalPropertyTypes`;
- `noImplicitReturns`;
- `noFallthroughCasesInSwitch`;
- `forceConsistentCasingInFileNames`;
- `module` and `moduleResolution` compatible with `NodeNext`.

## Package Verification

Release package checks must prove:

- VSIX contents exclude tests, fixtures, and source-only files unless intended;
- bundled entry point loads in an Extension Development Host;
- source-map and declaration policies match docs;
- declared `markdownlint-obsidian` version matches metadata and schema docs;
- generated files are produced by scripts, not edited by hand.

## Current Automation

```bash
bun extension/docs/tests/scripts/run-verification-gates.mjs
```

The script runs docs, repository, and extension package checks in this checkout.
