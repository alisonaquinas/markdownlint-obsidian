# Flavor Grenade Dependency Contract

## Decision Premise

The VS Code extension treats `flavor-grenade-lsp` as an installed extension
dependency and relies on the `ofmarkdown` language mode it contributes.

The manifest declares the dependency with VS Code's `extensionDependencies`
field:

```json
{
  "extensionDependencies": ["alisonaquinas.flavor-grenade-lsp"]
}
```

This is an extension dependency, not a lint engine dependency. Flavor Grenade
continues to own OFMarkdown language detection and language-mode promotion.
`markdownlint-obsidian` continues to own lint rules, configuration,
diagnostics, and fixes.

## Responsibility Split

| Concern | Owner |
| :--- | :--- |
| Detect Obsidian vault membership | Flavor Grenade LSP extension |
| Promote qualifying Markdown files to `ofmarkdown` | Flavor Grenade LSP extension |
| Provide OFMarkdown grammar and language configuration | Flavor Grenade LSP extension |
| Decide whether a document should receive OFM lint diagnostics | `markdownlint-obsidian` extension, using `languageId === "ofmarkdown"` |
| Run OFM and standard markdownlint rules | `markdownlint-obsidian` core |
| Publish lint diagnostics and code actions | `markdownlint-obsidian` extension |

## Activation Model

Primary activation is `onLanguage:ofmarkdown`.

The extension may also activate on a command or workspace event for setup,
configuration, and troubleshooting. It does not lint every `markdown` document
by default. Plain Markdown stays out of scope unless the user runs an explicit
workspace command or a later requirement adds opt-in generic Markdown linting.

## Document Eligibility

A document is eligible for live lint diagnostics when all of these are true:

- VS Code language id is `ofmarkdown`;
- URI scheme is supported by the lint execution strategy;
- workspace trust and custom-rule policy allow the required behavior;
- configuration can be resolved or a useful configuration error can be shown.

This lets Flavor Grenade make the expensive vault-membership decision once, and
lets `markdownlint-obsidian` stay focused on lint semantics.

## Missing Dependency Behavior

If the dependency is disabled, missing, or not installed:

- live linting does not silently fall back to all Markdown files;
- commands report that `flavor-grenade-lsp` is required for automatic
  OFMarkdown document selection;
- documentation explains that users can install the dependency or use CLI
  linting outside VS Code.

## Non-Goals

- Do not duplicate Flavor Grenade's vault detection or `ofmarkdown` promotion
  logic.
- Do not require Flavor Grenade's LSP server for lint rule execution.
- Do not treat `markdown` language documents as OFM solely because they have a
  `.md` extension.

## Source Notes

VS Code supports `extensionDependencies` for extensions that rely on another
extension's API or contribution surface. The dependency extension identifier is
the full `publisher.name` form. Flavor Grenade's researched extension manifest
uses publisher `alisonaquinas` and package name `flavor-grenade-lsp`.

See also:

- [Flavor Grenade research](../../../docs/research/flavor-grenade-lsp/technical-stack-and-architecture.md)
- [VS Code Extension API docs](https://code.visualstudio.com/api/references/vscode-api)
