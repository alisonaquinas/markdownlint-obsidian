/**
 * Unit coverage for live-lint document eligibility.
 *
 * These tests pin the Flavor Grenade dependency and `ofmarkdown` language-id
 * boundary so generic Markdown documents are not linted live by accident.
 */

import { describe, expect, it } from "bun:test";
import { decideEligibility } from "../../src/diagnostics/eligibility.js";
import type {
  DependencyState,
  DocumentSnapshot,
  ExtensionSettings,
  SessionState,
} from "../../src/shared/types.js";

const settings: ExtensionSettings = {
  enabled: true,
  runMode: "onType",
  debounceMs: 250,
  configPath: null,
  workspaceGlobs: ["**/*.md"],
};
const session: SessionState = { liveDiagnosticsEnabled: true };
const dependency: DependencyState = {
  id: "alisonaquinas.flavor-grenade-lsp",
  status: "installed-active",
  reason: null,
};

function document(overrides: Partial<DocumentSnapshot>): DocumentSnapshot {
  return {
    uri: "file:///vault/note.md",
    fsPath: "/vault/note.md",
    scheme: "file",
    languageId: "ofmarkdown",
    version: 1,
    isUntitled: false,
    text: "# Note\n",
    ...overrides,
  };
}

describe("decideEligibility", () => {
  it("accepts file-backed OFMarkdown documents", () => {
    expect(decideEligibility(document({}), settings, session, dependency).eligible).toBe(true);
  });

  it("rejects generic Markdown documents", () => {
    const decision = decideEligibility(
      document({ languageId: "markdown" }),
      settings,
      session,
      dependency,
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toContain("OFMarkdown");
  });

  it("rejects missing Flavor Grenade dependency", () => {
    const decision = decideEligibility(document({}), settings, session, {
      id: dependency.id,
      status: "missing",
      reason: "Flavor Grenade extension is missing",
    });

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe("Flavor Grenade extension is missing");
  });

  it("reports restricted-mode Flavor Grenade blocks before language mismatch", () => {
    const decision = decideEligibility(document({ languageId: "markdown" }), settings, session, {
      id: dependency.id,
      status: "blocked-restricted",
      reason: "Flavor Grenade is disabled in Restricted Mode",
    });

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe("Flavor Grenade is disabled in Restricted Mode");
  });

  it("rejects demoted Markdown documents so stale diagnostics can be cleared", () => {
    const decision = decideEligibility(
      document({ languageId: "markdown" }),
      settings,
      session,
      dependency,
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe("not an OFMarkdown document");
  });
});
