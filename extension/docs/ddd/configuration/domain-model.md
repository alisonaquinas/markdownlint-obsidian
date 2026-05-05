# Configuration And Trust Domain Model

## Purpose

The Configuration and Trust context decides which configuration and behaviors
are available for a workspace, document, or command.

## Entities

### WorkspacePolicy

Identity: workspace folder URI.

Owns:

- trusted or untrusted state;
- supported file-system strategy;
- custom rule permission;
- config watcher registration state.

Invariants:

- custom rule modules load only when policy permits executable workspace code;
- file writes occur only when trust and file-system policy allow them;
- unsupported workspace modes produce actionable messages.

## Value Objects

| Value Object | Fields | Meaning |
| :--- | :--- | :--- |
| `EffectiveExtensionConfig` | core config, extension settings, source metadata | Full config used by extension behavior |
| `ConfigSource` | URI, kind, precedence | One source that can influence configuration |
| `TrustDecision` | allowed, blocked reason | Whether a behavior is allowed in current trust context |
| `CustomRulePermission` | allowed, reason | Whether configured custom rules may load |
| `FileSystemCapability` | can read, can discover, can write, reason | Supported file operations for current workspace mode |

## Domain Services

### ConfigResolutionPolicy

Determines when to call core config loading and how to combine the result with
extension-only settings.

### TrustPolicy

Answers behavior-specific questions:

- can built-in rules run?
- can custom rules load?
- can fixes write files?
- can workspace lint discover files?

### ConfigWatcherPolicy

Identifies supported config filenames and decides which visible diagnostics
must refresh after a config file changes.

## Domain Events

| Event | Meaning |
| :--- | :--- |
| `EffectiveConfigChanged` | Visible eligible documents may need re-linting |
| `WorkspaceTrustChanged` | Behavior permissions must be recomputed |
| `CustomRulesBlocked` | Configured custom rules were skipped due to policy |
| `ConfigResolutionFailed` | Config could not be loaded or validated |
| `FileSystemCapabilityRejected` | A requested read, discover, or write operation is unsupported |

## Context Boundary

This context consumes core `LinterConfig` and validation errors. It does not
define rule options itself. VS Code settings are translated into extension
value objects before they influence behavior.
