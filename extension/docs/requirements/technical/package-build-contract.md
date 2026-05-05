# Package And Build Contract

## MarkdownlintObsidianTechnical.BunWorkspace

```text
Tag: MarkdownlintObsidianTechnical.BunWorkspace
Gist: Extension package scripts must fit the root Bun workspace workflow unless VS Code packaging requires an isolated step.
Ambition: Maintainers can typecheck, lint, test, and build all packages from the root without special manual setup.
Scale: Percentage of extension scripts reachable from root workspace scripts or documented release scripts.
Meter: Root `package.json` workspace membership, extension `package.json` scripts, CI workflow inspection, and local command execution.
Fail: Extension package is invisible to root verification, requires untracked install steps, or uses a package manager split without an accepted ADR.
Goal: 100% of routine extension checks are reachable from root or documented extension release commands.
Stakeholders: Extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [root package scripts](../../../../package.json); [architecture tooling requirement](../architecture/quality-gates.md).
```

Architecture trace: [ExtensionArchitecture.Tooling](../architecture/quality-gates.md)

## MarkdownlintObsidianTechnical.ExtensionPackage

```text
Tag: MarkdownlintObsidianTechnical.ExtensionPackage
Gist: The VS Code extension package owns editor integration only.
Ambition: Extension source remains a typed adapter around public markdownlint-obsidian APIs and VS Code APIs.
Scale: Percentage of extension production modules whose imports respect package and architecture boundaries.
Meter: Import-boundary checks and source review verifying extension code imports bundled library public APIs, VS Code APIs, local extension modules, and approved package dependencies only.
Fail: Extension source imports core internals, duplicates rule algorithms, imports CLI process code for runtime linting, shells out to a user-installed CLI, or causes core packages to depend on extension code.
Goal: 100% of extension-code imports follow documented boundaries.
Stakeholders: Extension maintainers, core maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [namespace and module structure](../../../../docs/architecture/namespace-and-module-structure.md); [extension package boundary](../architecture/vscode-extension-specifics.md).
```

Architecture trace: [ExtensionArchitecture.PackageBoundary](../architecture/vscode-extension-specifics.md)

## MarkdownlintObsidianTechnical.BundledLibraryRuntime

```text
Tag: MarkdownlintObsidianTechnical.BundledLibraryRuntime
Gist: Bundle and call the markdownlint-obsidian library from inside the extension.
Ambition: Extension users get lint diagnostics, fixes, previews, and workspace commands without installing `markdownlint-obsidian-cli`.
Scale: Percentage of extension runtime lint/fix paths served by the packaged `markdownlint-obsidian` library dependency.
Meter: `extension/package.json` dependency review, bundle inspection, source import-boundary tests, and extension-host smoke tests in an environment with no global or workspace CLI binary.
Fail: Any normal extension feature requires `markdownlint-obsidian-cli` to be globally installed, installed in the workspace, or spawned as a subprocess.
Goal: 100% of runtime lint/fix behavior uses the bundled library and 0 normal paths require CLI installation.
Stakeholders: Extension users, extension maintainers, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [extension architecture overview](../../architecture/overview.md); [public API guide](../../../../docs/guides/public-api.md).
```

Architecture trace: [ExtensionArchitecture.LibraryRuntime](../architecture/vscode-extension-specifics.md)

## MarkdownlintObsidianTechnical.BuildOutputs

```text
Tag: MarkdownlintObsidianTechnical.BuildOutputs
Gist: Extension build outputs must be reproducible and packageable.
Ambition: The VSIX entry point, bundled library runtime, source maps, declaration policy, and packaged files are produced by scripts, not hand editing.
Scale: Percentage of extension release builds that produce expected artifacts from clean source and package only intended files.
Meter: Extension build command, package inspection, `.vscodeignore`, VSIX smoke install, and source-map policy review.
Fail: Extension package points to a missing entry point, omits the bundled `markdownlint-obsidian` runtime, includes tests or source-only files unintentionally, requires hand-edited build output, or cannot load in an Extension Development Host.
Goal: 100% of release builds produce a loadable VSIX with expected contents.
Stakeholders: Extension users, release maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [extension build requirement](../architecture/vscode-extension-specifics.md); [root package scripts](../../../../package.json).
```

Architecture trace: [ExtensionArchitecture.BuildAndBundle](../architecture/vscode-extension-specifics.md)

## MarkdownlintObsidianTechnical.DependencyBoundary

```text
Tag: MarkdownlintObsidianTechnical.DependencyBoundary
Gist: Extension dependencies must preserve the Flavor Grenade and core ownership split.
Ambition: Flavor Grenade provides `ofmarkdown`; markdownlint-obsidian core provides lint and fix semantics; VS Code extension code provides editor adapters.
Scale: Percentage of dependency declarations and runtime imports that match documented ownership.
Meter: Manifest inspection for `alisonaquinas.flavor-grenade-lsp`, package dependency review for `markdownlint-obsidian`, and import-boundary tests.
Fail: Extension reimplements Flavor Grenade classification, depends on Flavor Grenade internals, duplicates core lint behavior, or uses unpublished core internals.
Goal: 100% of dependency relationships preserve documented ownership.
Stakeholders: Obsidian vault authors, extension maintainers, core maintainers.
Owner: markdownlint-obsidian VS Code extension.
Source: [Flavor Grenade dependency contract](../../architecture/flavor-grenade-dependency.md); [extension architecture overview](../../architecture/overview.md).
```

Functional trace: `MarkdownlintObsidian.ExtensionDependency`,
`MarkdownlintObsidian.DocumentEligibility`
