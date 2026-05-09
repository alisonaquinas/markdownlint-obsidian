/**
 * Detects the installed state of Flavor Grenade without importing its runtime.
 *
 * Flavor Grenade owns OFMarkdown document classification. This extension only
 * needs to know whether VS Code can see that dependency before relying on the
 * `ofmarkdown` language id for live diagnostics.
 *
 * @module dependencies/flavorGrenade
 */

import { FLAVOR_GRENADE_EXTENSION_ID } from "../shared/constants.js";
import type { DependencyState } from "../shared/types.js";

/** Minimal subset of VS Code's extension registry needed for dependency checks. */
export interface ExtensionRegistry {
  getExtension(id: string): { readonly isActive: boolean } | undefined;
}

/** Workspace facts that mirror Flavor Grenade's startup guardrails. */
export interface FlavorGrenadeEnvironment {
  readonly isTrusted: boolean;
  readonly workspaceFolderSchemes: readonly string[];
}

/**
 * Read Flavor Grenade's installation and activation state from VS Code.
 *
 * @param registry - VS Code extension registry or a test double.
 * @param environment - Workspace trust and URI scheme facts for startup guards.
 * @returns Dependency state used by document eligibility and user messaging.
 */
export function detectFlavorGrenade(
  registry: ExtensionRegistry,
  environment?: FlavorGrenadeEnvironment,
): DependencyState {
  const extension = registry.getExtension(FLAVOR_GRENADE_EXTENSION_ID);
  if (extension === undefined) {
    return state("missing", "Flavor Grenade extension is missing");
  }

  const blocked = environmentBlock(environment);
  if (blocked !== null) return blocked;

  return {
    id: FLAVOR_GRENADE_EXTENSION_ID,
    status: extension.isActive ? "installed-active" : "installed-inactive",
    reason: extension.isActive ? null : "Flavor Grenade extension is installed but inactive",
  };
}

function state(status: DependencyState["status"], reason: string): DependencyState {
  return { id: FLAVOR_GRENADE_EXTENSION_ID, status, reason };
}

function environmentBlock(
  environment: FlavorGrenadeEnvironment | undefined,
): DependencyState | null {
  if (environment?.isTrusted === false) {
    return state("blocked-restricted", "Flavor Grenade is disabled in Restricted Mode");
  }

  if (isVirtualWorkspace(environment?.workspaceFolderSchemes)) {
    return state("blocked-virtual", "Flavor Grenade requires file-backed workspace folders");
  }

  return null;
}

function isVirtualWorkspace(schemes: readonly string[] | undefined): boolean {
  return (
    schemes !== undefined && schemes.length > 0 && schemes.every((scheme) => scheme !== "file")
  );
}
