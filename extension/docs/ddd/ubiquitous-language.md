# Extension Ubiquitous Language

Canonical terms for the VS Code extension domain. Use these names in extension
docs, tests, and source.

## Editor Client Context

| Term | Definition |
| :--- | :--- |
| **Extension Session** | One active lifetime of the VS Code extension after activation. State such as temporary lint disablement belongs here. |
| **Flavor Grenade Dependency** | The installed VS Code extension `alisonaquinas.flavor-grenade-lsp`, used for OFMarkdown language classification. |
| **OFMarkdown Document** | A VS Code text document whose language id is `ofmarkdown`. Flavor Grenade assigns this identity. |
| **Generic Markdown Document** | A VS Code text document whose language id is `markdown`. It is not live-linted by default. |
| **Document Eligibility** | The extension decision that a document may receive live lint diagnostics. The primary predicate is `languageId === "ofmarkdown"`. |
| **Dependency State** | The extension's observed state for Flavor Grenade: installed and enabled, missing, disabled, or not yet active. |

## Lint Feedback Context

| Term | Definition |
| :--- | :--- |
| **Live Lint** | A lint run triggered by editor lifecycle events for an eligible OFMarkdown document. |
| **Diagnostic Projection** | The VS Code diagnostic produced from a core `LintError`. |
| **Diagnostic Collection** | The VS Code collection owned by this extension for markdownlint-obsidian diagnostics. |
| **Stale Diagnostic** | A diagnostic produced from an older document version, configuration, or eligibility state. Stale diagnostics must not remain visible. |
| **Run Mode** | User setting that controls whether live lint runs on type or on save. |
| **Temporary Disable** | In-memory session switch that suppresses live diagnostics without changing config files. |

## Configuration And Trust Context

| Term | Definition |
| :--- | :--- |
| **Effective Extension Config** | The resolved settings used by the extension after combining VS Code settings with core `LinterConfig` behavior and documented extension-only options. |
| **Config Source** | A file or VS Code setting that influences lint behavior. Supported files are defined by core config loading. |
| **Trust Policy** | Rules that decide which behavior is available in trusted, untrusted, remote, and virtual workspaces. |
| **Custom Rule Permission** | Decision that configured custom rule modules may be loaded in the current workspace. |
| **File-System Strategy** | The documented way the extension performs or rejects reads, discovery, vault lookup, and writes for a workspace mode. |

## Fix Workflow Context

| Term | Definition |
| :--- | :--- |
| **Quick Fix** | A VS Code code action that applies one core `Fix` from one diagnostic. |
| **Fix All** | A VS Code action or command that applies all safe core fixes for a selected document or rule scope. |
| **Fix Preview** | A no-write workflow that reports available fixes, mirroring core check mode. |
| **Fix Conflict** | A core-reported overlap between fixes where not every candidate edit can be applied safely. |
| **Formatting Boundary** | Policy that extension edits are rule-provided fixes, not general Markdown formatting. |

## Workspace Commands Context

| Term | Definition |
| :--- | :--- |
| **Workspace Lint** | A user-invoked command that runs lint across configured workspace files. |
| **Open Config Command** | A user-invoked command that opens the nearest supported config file or starts a valid config draft. |
| **Output Channel** | VS Code output surface for extension logs, errors, and command results. |
| **Configuration Watcher** | File watcher that refreshes visible diagnostics after supported config files change. |
| **Actionable Error** | User-visible failure message that includes enough context to fix config, dependency, trust, or lint problems. |
