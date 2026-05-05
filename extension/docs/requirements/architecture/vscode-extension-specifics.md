# VS Code Extension Technical Requirements

Architecture requirements adapted to the VS Code extension package.

## ExtensionArchitecture.PackageBoundary

```text
Tag: ExtensionArchitecture.PackageBoundary
Gist: Keep the VS Code extension as an editor adapter around core lint behavior.
Ambition: Extension code owns VS Code integration while `packages/core` owns lint semantics.
Scale: Percentage of extension production modules whose behavior is editor integration, dependency detection, document eligibility, diagnostic mapping, code-action mapping, command registration, settings, packaging, or tests.
Meter: Source review and import-boundary tests verifying extension modules call bundled `markdownlint-obsidian` public APIs and do not implement OFM rules, parser extractors, config merging, vault indexing, or fix algorithms.
Fail: Extension source duplicates core lint behavior, imports core internals instead of public APIs, or shells out to a user-installed CLI for runtime behavior.
Goal: 100% of extension lint behavior is delegated to bundled `markdownlint-obsidian` public APIs.
Stakeholders: Extension users, core maintainers, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root architecture policy](../../../../docs/architecture/README.md); [extension architecture overview](../../architecture/overview.md).
```

## ExtensionArchitecture.LibraryRuntime

```text
Tag: ExtensionArchitecture.LibraryRuntime
Gist: Bundle the markdownlint-obsidian library into the VS Code extension runtime.
Ambition: Editor linting, fixes, preview, and workspace commands work without requiring users to install the CLI.
Scale: Percentage of runtime lint and fix paths that invoke bundled library APIs instead of spawning `markdownlint-obsidian-cli`.
Meter: Manifest and package dependency review, bundle inspection, import-boundary tests, and VS Code integration tests on a clean machine with no global CLI installed.
Fail: Any extension runtime path requires a globally installed CLI, a workspace-installed CLI, or a shell subprocess for normal lint/fix behavior.
Goal: 100% of normal extension lint/fix behavior uses the bundled `markdownlint-obsidian` library.
Stakeholders: Extension users, extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [extension architecture overview](../../architecture/overview.md); [technical package contract](../technical/package-build-contract.md).
```

## ExtensionArchitecture.ManifestSpecifics

```text
Tag: ExtensionArchitecture.ManifestSpecifics
Gist: Express extension architecture through VS Code manifest fields.
Ambition: VS Code can install, activate, configure, and constrain the extension according to the documented design.
Scale: Percentage of required manifest fields present with expected values for extension dependency, activation, commands, configuration, capabilities, extension kind, and build entry point.
Meter: Manifest inspection test against extension `package.json`.
Fail: Manifest lacks `extensionDependencies` for Flavor Grenade, omits `onLanguage:ofmarkdown` activation, points `main` at a missing build artifact, or leaves trust/virtual workspace posture undeclared.
Goal: 100% of required manifest fields match documented extension architecture.
Stakeholders: VS Code users, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Flavor Grenade Dependency Contract](../../architecture/flavor-grenade-dependency.md); [functional contributions](../functional/contributions-and-trust.md).
```

## ExtensionArchitecture.BuildAndBundle

```text
Tag: ExtensionArchitecture.BuildAndBundle
Gist: Build the extension into a small VS Code-compatible bundle.
Ambition: Extension packaging is reproducible, includes the library runtime needed by the extension, and excludes source-only or test-only files from VSIX output.
Scale: Percentage of extension release builds that produce the expected bundled entry point, source map policy, package metadata, and VSIX contents.
Meter: CI build and package inspection using extension build script, `vsce package`, `.vscodeignore`, bundle dependency review, and smoke install in an Extension Development Host.
Fail: Build output is missing, VSIX omits the required `markdownlint-obsidian` library runtime, includes unintended source/tests/node_modules, bundled code cannot load in VS Code, or package metadata points to nonexistent files.
Goal: 100% of release builds produce a loadable VSIX with expected contents.
Stakeholders: Extension users, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [functional manifest requirements](../functional/contributions-and-trust.md); [extension plans](../../plans/index.md).
```

## ExtensionArchitecture.DependencyRuntime

```text
Tag: ExtensionArchitecture.DependencyRuntime
Gist: Treat Flavor Grenade as document-classification dependency, not lint engine dependency.
Ambition: Missing or disabled Flavor Grenade affects automatic document selection, not core lint rule availability.
Scale: Percentage of runtime paths that handle Flavor Grenade installed, disabled, missing, and active states according to the dependency contract.
Meter: VS Code integration tests covering installation states, `ofmarkdown` document activation, generic `markdown` documents, explicit workspace lint command, and output messaging.
Fail: Missing Flavor Grenade crashes the extension, live-lints all Markdown silently, or prevents explicit core lint commands that do not require `ofmarkdown`.
Goal: 100% of covered dependency states follow documented runtime behavior.
Stakeholders: Obsidian vault authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Flavor Grenade Dependency Contract](../../architecture/flavor-grenade-dependency.md); [functional editing requirements](../functional/editing-linting.md).
```

## ExtensionArchitecture.TestHarness

```text
Tag: ExtensionArchitecture.TestHarness
Gist: Provide test layers that match VS Code extension risk.
Ambition: Fast unit tests cover adapters, and extension-host smoke tests cover VS Code integration.
Scale: Percentage of extension behaviors covered by the appropriate test harness: pure unit tests for mapping/path logic and extension-host tests for manifest activation, diagnostics, code actions, commands, and dependency behavior.
Meter: CI test inventory review plus coverage of representative extension behaviors in unit and integration test commands.
Fail: VS Code-only behavior is tested only with plain Node unit tests, or pure mapping behavior requires slow extension-host tests without reason.
Goal: 100% of extension behavior has a matching test layer or documented exception.
Stakeholders: Extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Test-Driven Development](../../../../docs/architecture/test-driven-development.md); [functional requirements](../functional/index.md).
```
