/**
 * Shared extension-domain types used to keep VS Code API objects out of the
 * pure adapter, eligibility, diagnostic, and fix-mapping modules.
 *
 * The runtime converts VS Code documents and settings into these values before
 * invoking the bundled `markdownlint-obsidian` library.
 *
 * @module shared/types
 */

import type { LintResult } from "markdownlint-obsidian/api";

/** Controls when live diagnostics are refreshed for eligible documents. */
export type RunMode = "onType" | "onSave";

/** Normalized VS Code settings for one resource. */
export interface ExtensionSettings {
  readonly enabled: boolean;
  readonly runMode: RunMode;
  readonly debounceMs: number;
  readonly configPath: string | null;
  readonly workspaceGlobs: readonly string[];
}

/** Observed availability state for the Flavor Grenade extension. */
export type DependencyStatus =
  "installed-active" | "installed-inactive" | "missing" | "blocked-restricted" | "blocked-virtual";

/** Dependency state surfaced to eligibility and command reporting. */
export interface DependencyState {
  readonly id: string;
  readonly status: DependencyStatus;
  readonly reason: string | null;
}

/** Session-only state that is intentionally not persisted into VS Code settings. */
export interface SessionState {
  readonly liveDiagnosticsEnabled: boolean;
}

/** Serializable view of a VS Code text document used by pure decision modules. */
export interface DocumentSnapshot {
  readonly uri: string;
  readonly fsPath: string | null;
  readonly scheme: string;
  readonly languageId: string;
  readonly version: number;
  readonly isUntitled: boolean;
  readonly text: string;
}

/** Result of applying extension eligibility rules to one document snapshot. */
export interface EligibilityDecision {
  readonly eligible: boolean;
  readonly reason: string | null;
}

/** Zero-based editor position compatible with VS Code ranges. */
export interface TextPosition {
  readonly line: number;
  readonly character: number;
}

/** Zero-based editor range compatible with VS Code ranges. */
export interface TextRange {
  readonly start: TextPosition;
  readonly end: TextPosition;
}

/** Diagnostic payload after converting core lint errors into editor terms. */
export interface DiagnosticData {
  readonly range: TextRange;
  readonly severity: "error" | "warning";
  readonly source: "markdownlint-obsidian";
  readonly code: string;
  readonly message: string;
  readonly fixable: boolean;
}

/** Editor-neutral text edit produced from a core fix. */
export interface TextEditData {
  readonly range: TextRange;
  readonly newText: string;
}

/** Request for linting one in-memory document through the bundled core library. */
export interface LintDocumentRequest {
  readonly filePath: string;
  readonly text: string;
  readonly workspaceRoot: string;
  readonly configPath: string | null;
  readonly allowCustomRules: boolean;
}

/** Request for linting workspace files through the bundled core library. */
export interface WorkspaceLintRequest {
  readonly workspaceRoot: string;
  readonly globs: readonly string[];
  readonly configPath: string | null;
  readonly allowCustomRules: boolean;
}

/** Runtime boundary implemented by the core-library adapter and faked in tests. */
export interface LintEngine {
  lintDocument(request: LintDocumentRequest): Promise<LintResult>;
  fixDocument(
    request: LintDocumentRequest,
  ): Promise<{ readonly text: string; readonly result: LintResult }>;
  lintWorkspace(request: WorkspaceLintRequest): Promise<readonly LintResult[]>;
}
