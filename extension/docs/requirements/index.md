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

User requirements live under [user/](user/index.md).

| File | Focus |
| :--- | :--- |
| [user/editing-feedback.md](user/editing-feedback.md) | Activation, document eligibility, current diagnostics, run modes, vault-aware feedback |
| [user/fixes-formatting.md](user/fixes-formatting.md) | Quick fixes, fix-all, fix-check preview, rule docs, formatting limits |
| [user/configuration.md](user/configuration.md) | Config discovery, schema help, custom rules, rule family visibility |
| [user/workspace-and-trust.md](user/workspace-and-trust.md) | Workspace lint, temporary disable, trust, unsupported modes, actionable errors |

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
