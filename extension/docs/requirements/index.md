# Extension Requirements

Requirements for the planned VS Code extension.

## Requirement Areas

| Area | Purpose |
| :--- | :--- |
| Editing feedback | Show lint diagnostics while users edit OFMarkdown files |
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
| [user/editing-feedback.md](user/editing-feedback.md) | Flavor Grenade dependency, activation, document eligibility, current diagnostics, run modes, vault-aware feedback |
| [user/fixes-formatting.md](user/fixes-formatting.md) | Quick fixes, fix-all, fix-check preview, rule docs, formatting limits |
| [user/configuration.md](user/configuration.md) | Config discovery, schema help, custom rules, rule family visibility |
| [user/workspace-and-trust.md](user/workspace-and-trust.md) | Workspace lint, temporary disable, trust, unsupported modes, actionable errors |

## Functional Requirements

Functional requirements live under [functional/](functional/index.md).

| File | Focus |
| :--- | :--- |
| [functional/editing-linting.md](functional/editing-linting.md) | Flavor Grenade dependency, activation, eligibility, triggers, config, diagnostics |
| [functional/fixes-formatting.md](functional/fixes-formatting.md) | Code actions, quick fixes, fix-all, fix-check preview, formatting boundary, rule help |
| [functional/workspace-commands.md](functional/workspace-commands.md) | Workspace lint, config opening, temporary disable, config watchers |
| [functional/contributions-and-trust.md](functional/contributions-and-trust.md) | Manifest contributions, schemas, workspace trust, custom rule trust, file-system strategy |
| [functional/test-derived.md](functional/test-derived.md) | Error reporting and metadata consistency |
