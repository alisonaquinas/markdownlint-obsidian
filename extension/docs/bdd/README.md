# Extension BDD

Behavior-domain specifications for the `markdownlint-obsidian` VS Code
extension.

These scenarios describe user-observable behavior and are automated at the
thinnest useful level: manifest inspection, extension-host integration, or
core-adapter component tests.

## Scope

- Capture acceptance behavior for the VS Code extension.
- Use the extension ubiquitous language from [DDD](../ddd/README.md).
- Trace scenarios back to user and functional requirements.
- Avoid restating core lint-rule behavior already covered by root
  [BDD features](../../../docs/bdd/features).

## Inventory

| File | Behavior |
| :--- | :--- |
| [features/activation-and-eligibility.feature](features/activation-and-eligibility.feature) | Flavor Grenade dependency, activation, and document eligibility |
| [features/live-diagnostics.feature](features/live-diagnostics.feature) | live lint triggers, diagnostic projection, run modes, and stale diagnostic handling |
| [features/fixes-and-formatting.feature](features/fixes-and-formatting.feature) | quick fixes, fix all, fix preview, rule help, and formatting boundary |
| [features/configuration-and-trust.feature](features/configuration-and-trust.feature) | config resolution, schema assistance, custom rules, trust, and file-system policy |
| [features/workspace-commands.feature](features/workspace-commands.feature) | workspace lint, open config, toggle linting, output, and configuration watchers |
| [features/packaging-and-metadata.feature](features/packaging-and-metadata.feature) | manifest contributions, dependency metadata, and release consistency |
| [traceability.md](traceability.md) | mapping from scenarios to requirements and DDD contexts |

## Automation Levels

| Level | Use For |
| :--- | :--- |
| Manifest inspection | `package.json` contribution points, activation events, dependency ids, schema paths, command ids |
| Extension-host integration | document language changes, diagnostics, code actions, commands, workspace trust, configuration watchers |
| Component tests | eligibility decisions, diagnostic projection, fix translation, error reporting, metadata mapping |
| Core tests | OFM rule semantics, config merge behavior, fix conflict handling, vault resolution |

## Scenario Rules

- One scenario should communicate one rule or contract.
- `Given` steps name domain preconditions, not VS Code setup mechanics.
- `When` steps describe one meaningful trigger.
- `Then` steps describe observable editor, command, or output behavior.
- Implementation details belong in step bindings, fixtures, or lower-level tests.
