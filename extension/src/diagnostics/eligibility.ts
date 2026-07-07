/**
 * Applies the extension's document eligibility policy before live linting.
 *
 * The decision deliberately treats Flavor Grenade as the source of truth for
 * OFMarkdown classification and rejects generic Markdown, untitled documents,
 * and unsupported URI schemes before any core lint work starts.
 *
 * @module diagnostics/eligibility
 */

import type {
  DependencyState,
  DocumentSnapshot,
  EligibilityDecision,
  ExtensionSettings,
  SessionState,
} from "../shared/types.js";
import { resolveMarkdownFlavor } from "markdown-flavor-detection";

/**
 * Decide whether a document should receive live markdownlint-obsidian feedback.
 *
 * @param document - Editor-neutral snapshot of the candidate document.
 * @param settings - Normalized extension settings for the document.
 * @param session - Session-only live diagnostics state.
 * @param dependency - Observed Flavor Grenade dependency state.
 * @returns Eligibility result plus the first rejection reason, when ineligible.
 */
export function decideEligibility(
  document: DocumentSnapshot,
  settings: ExtensionSettings,
  session: SessionState,
  dependency: DependencyState,
): EligibilityDecision {
  const rejection = firstRejection(document, settings, session, dependency);
  return rejection === null ? { eligible: true, reason: null } : reject(rejection);
}

function reject(reason: string): EligibilityDecision {
  return { eligible: false, reason };
}

function firstRejection(
  document: DocumentSnapshot,
  settings: ExtensionSettings,
  session: SessionState,
  dependency: DependencyState,
): string | null {
  const checks = rejectionChecks(document, settings, session, dependency);
  for (const check of checks) {
    const message = check();
    if (message !== null) return message;
  }
  return null;
}

function rejectionChecks(
  document: DocumentSnapshot,
  settings: ExtensionSettings,
  session: SessionState,
  dependency: DependencyState,
): readonly (() => string | null)[] {
  return [
    (): string | null => when(!settings.enabled, "disabled by settings"),
    (): string | null => when(!session.liveDiagnosticsEnabled, "disabled for this session"),
    (): string | null =>
      when(
        dependency.status === "blocked-restricted" || dependency.status === "blocked-virtual",
        dependency.reason ?? "Flavor Grenade is unavailable",
      ),
    (): string | null => flavorRejection(document),
    (): string | null => when(document.isUntitled, "untitled documents are unsupported"),
    (): string | null =>
      when(document.scheme !== "file", `unsupported URI scheme: ${document.scheme}`),
    (): string | null => when(document.fsPath === null, "document has no filesystem path"),
    (): string | null =>
      when(
        dependency.status === "missing" || dependency.status === "installed-inactive",
        dependency.reason ?? "Flavor Grenade extension is unavailable",
      ),
  ];
}

function when(condition: boolean, message: string): string | null {
  return condition ? message : null;
}

function flavorRejection(document: DocumentSnapshot): string | null {
  const resolution = resolveMarkdownFlavor({
    path: document.fsPath ?? document.uri,
    languageId: markdownFlavorLanguageId(document.languageId),
    hasObsidianMarker: document.languageId === "ofmarkdown",
    syntaxText: document.text,
  });

  if (resolution.kind === "inactive") {
    return "not an OFMarkdown document";
  }

  if (resolution.effective !== "obsidian") {
    return `not an OFMarkdown document (detected ${resolution.effective})`;
  }

  return null;
}

function markdownFlavorLanguageId(languageId: string): string {
  return languageId === "ofmarkdown" ? "markdown" : languageId;
}
