# Architecture Quality Gates

## ExtensionArchitecture.TDD

```text
Tag: ExtensionArchitecture.TDD
Gist: Extension production behavior enters through tests.
Ambition: Editor behavior remains safe to change as diagnostics, code actions, commands, and dependency handling evolve.
Scale: Percentage of extension behavior changes that include a failing unit or integration test before implementation.
Meter: Pull request review and CI evidence for changed extension source files, checking for matching tests that fail without the production change.
Fail: Any non-trivial extension behavior lands without a test that would fail before the change.
Goal: 100% of non-trivial extension behavior changes include failing-first test evidence.
Stakeholders: Extension maintainers, Markdown authors.
Owner: markdownlint-obsidian VS Code extension.
Source: [Test-Driven Development](../../../../docs/architecture/test-driven-development.md).
```

## ExtensionArchitecture.Tooling

```text
Tag: ExtensionArchitecture.Tooling
Gist: Extension code and docs pass local and CI checks.
Ambition: Tooling catches formatting, lint, type, test, and docs issues before release.
Scale: Percentage of required extension verification commands that pass for a release candidate.
Meter: CI job running extension typecheck, lint, unit tests, integration smoke tests, package checks, and `markdownlint-obsidian` over `extension/docs/**/*.md`.
Fail: Any required extension verification command fails or is absent from CI.
Goal: 100% required extension verification commands pass in CI and are documented for local use.
Stakeholders: Extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Linting and Tooling](../../../../docs/architecture/linting-and-tooling.md).
```

## ExtensionArchitecture.TypeSafety

```text
Tag: ExtensionArchitecture.TypeSafety
Gist: Extension boundaries are typed and validated.
Ambition: VS Code inputs, config files, and core lint results are converted through explicit typed adapters.
Scale: Percentage of extension public functions, adapter boundaries, and config parsing paths that avoid implicit `any` and validate unknown external input before use.
Meter: TypeScript strict-mode check plus targeted unit tests for settings, command arguments, diagnostic conversion, and Flavor Grenade dependency detection.
Fail: Any extension production path relies on implicit `any`, unchecked JSON/config input, or unvalidated external command arguments.
Goal: 100% of checked extension boundaries are strictly typed and validated.
Stakeholders: Extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Type Safety](../../../../docs/architecture/type-safety.md).
```

## ExtensionArchitecture.Documentation

```text
Tag: ExtensionArchitecture.Documentation
Gist: Extension public behavior is documented with the code it affects.
Ambition: Users and maintainers can understand extension commands, settings, trust behavior, and Flavor Grenade dependency without reading source.
Scale: Percentage of public extension commands, settings, contribution points, trust limitations, and diagnostics behaviors documented in `extension/docs/` or extension README.
Meter: Manifest-to-docs audit comparing extension `package.json` contributions with docs and README entries.
Fail: Any public command, setting, dependency, or trust limitation lacks documentation.
Goal: 100% of public extension surface has matching documentation.
Stakeholders: VS Code users, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Documentation Policy](../../../../docs/architecture/documentation-policy.md).
```
