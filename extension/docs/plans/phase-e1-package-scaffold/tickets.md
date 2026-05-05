# Phase E1 Tickets

## FEAT-002: Buildable VS Code Extension Package Scaffold

Status: `draft`

Goal: create a no-op extension package that builds, typechecks, lints, tests,
packages, and declares the right runtime dependencies.

Linked plan: [Phase E1](../phase-e1-package-scaffold.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-003` | task | Create extension manifest and package scripts | `open` |
| `TASK-004` | task | Add strict TypeScript and test scaffold | `open` |
| `TASK-005` | task | Add extension build and VSIX package check | `open` |
| `CHORE-002` | chore | Wire root scripts and docs automation | `open` |

Acceptance criteria:

- [ ] extension package builds from clean source.
- [ ] Flavor Grenade dependency and `ofmarkdown` activation are declared.
- [ ] `markdownlint-obsidian` library is a runtime dependency.
- [ ] no runtime dependency requires `markdownlint-obsidian-cli`.

## TASK-003: Create Extension Manifest And Package Scripts

Scope: create `extension/package.json` with VS Code metadata, scripts,
activation events, commands, configuration placeholders, workspace-trust
posture, and `extensionDependencies`.

Linked requirements:

- `FR.Activation.OFM.Language`
- `FR.Dependency.FlavorGrenade.Required`
- `Tech.Package.BuildContract`

Done when manifest inspection confirms the declared dependency and activation
surface.

## TASK-004: Add Strict TypeScript And Test Scaffold

Scope: add extension TypeScript configs, source skeleton, unit test directory,
and extension-host smoke harness.

Done when `bun --cwd extension test` and extension typecheck can run against
the empty activation module.

## TASK-005: Add Extension Build And VSIX Package Check

Scope: bundle `src/extension.ts` for VS Code, keep `vscode` external, and add a
package inspection command.

Done when a local package check proves the VSIX entry point and file list are
intentional.

## CHORE-002: Wire Root Scripts And Docs Automation

Scope: update root workspace scripts and `extension/docs/tests/automation.md`
with concrete extension commands.

Done when root CI entry points can invoke extension lint, typecheck, build, and
tests without weakening existing gates.
