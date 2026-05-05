# Architecture Structure Requirements

## ExtensionArchitecture.Coherence

```text
Tag: ExtensionArchitecture.Coherence
Gist: Extension modules each own one editor-integration concept.
Ambition: Activation, diagnostics, config, fixes, commands, and dependency checks can change independently.
Scale: Percentage of extension production modules whose exported responsibilities fit one named concept.
Meter: Architecture review and source inspection for each extension module, checking exports, imports, tests, and reasons to change.
Fail: Any module mixes unrelated concerns such as diagnostics mapping, command registration, and config loading without a named composition role.
Goal: 100% of extension modules have a single coherent responsibility or are explicitly documented composition roots.
Stakeholders: Extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [High Coherence](../../../../docs/architecture/high-coherence.md).
```

## ExtensionArchitecture.LowCoupling

```text
Tag: ExtensionArchitecture.LowCoupling
Gist: Extension dependencies are explicit and acyclic.
Ambition: Editor adapters can change without changing core lint rules, and core behavior can change without VS Code-specific imports.
Scale: Percentage of extension-core interactions that pass through public core APIs or explicit adapter contracts.
Meter: Import-boundary test and source inspection verifying no core module imports extension code, no extension code imports core internals, and no import cycles exist in extension modules.
Fail: Core imports extension code, extension imports core internals instead of public APIs, or extension modules form an import cycle.
Goal: 100% of extension-core interactions use public APIs or explicit adapter contracts and 0 import cycles exist.
Stakeholders: Core maintainers, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Low Coupling](../../../../docs/architecture/low-coupling.md).
```

## ExtensionArchitecture.ModuleStructure

```text
Tag: ExtensionArchitecture.ModuleStructure
Gist: Extension source layout mirrors architecture boundaries.
Ambition: Developers can locate activation, diagnostics, fixes, commands, settings, and test code without guessing.
Scale: Percentage of extension source and test files located in directories that match their architectural responsibility.
Meter: Source tree review comparing extension files against the approved module layout and test mirror.
Fail: Any production file lives in a generic catch-all location without a clear boundary, or tests cannot be mapped to the behavior they verify.
Goal: 100% of extension source and test files fit the approved layout or have an explicit documented exception.
Stakeholders: Extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Namespace and Module Structure](../../../../docs/architecture/namespace-and-module-structure.md).
```

## ExtensionArchitecture.DependencyBoundary

```text
Tag: ExtensionArchitecture.DependencyBoundary
Gist: Flavor Grenade classifies documents; markdownlint-obsidian lints them.
Ambition: The extension uses `ofmarkdown` as a dependency-provided signal without duplicating Flavor Grenade vault detection.
Scale: Percentage of live-lint eligibility decisions that depend on `languageId === "ofmarkdown"` or explicit user command scope, not duplicate vault membership logic.
Meter: Unit and integration tests for documents classified as `ofmarkdown`, generic `markdown`, missing Flavor Grenade dependency, and explicit workspace lint command paths.
Fail: Live linting reimplements Flavor Grenade vault detection, lints all Markdown by default, or requires Flavor Grenade's LSP server for core rule execution.
Goal: 100% of live-lint eligibility follows the documented dependency boundary.
Stakeholders: Obsidian vault authors, extension maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Flavor Grenade Dependency Contract](../../architecture/flavor-grenade-dependency.md).
```
