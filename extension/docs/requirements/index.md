# Extension Requirements

Requirements for the planned VS Code extension.

## Requirement Areas

| Area | Purpose |
| :--- | :--- |
| Editing feedback | Show lint diagnostics while users edit Markdown files |
| Fixes | Offer quick fixes and fix-all actions for safe core fixes |
| Workspace commands | Run lint, open config, show output, and reload extension state |
| Configuration | Map VS Code settings to stable core and CLI configuration concepts |
| Workspace trust | Define behavior in trusted, untrusted, local, remote, and virtual workspaces |
| Packaging | Define VSIX contents, build artifacts, and CI checks |
| Testing | Cover activation, diagnostics, fixes, config, and workspace command smoke paths |

## User Requirements

Planned user requirement documents should live under
`extension/docs/requirements/user/`.

Initial user needs:

- See lint issues in open Markdown files without running the CLI manually.
- Apply safe automatic fixes from the editor.
- Run lint across a workspace from the Command Palette.
- Use existing `.obsidian-linter.jsonc` configuration.
- Understand why linting is unavailable in unsupported workspace modes.

## Functional Requirements

Planned functional requirement documents should live under
`extension/docs/requirements/functional/`.

Initial functional needs:

- Activate for `markdown` files.
- Maintain a `DiagnosticCollection` owned by the extension.
- Debounce document linting to avoid excessive work while typing.
- Convert core line and column positions into VS Code ranges.
- Register code actions only for diagnostics that carry safe fixes.
- Respect workspace trust and virtual workspace declarations.
- Provide testable adapters around VS Code APIs.
