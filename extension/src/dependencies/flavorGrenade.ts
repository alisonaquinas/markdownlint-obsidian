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

/**
 * Read Flavor Grenade's installation and activation state from VS Code.
 *
 * @param registry - VS Code extension registry or a test double.
 * @returns Dependency state used by document eligibility and user messaging.
 */
export function detectFlavorGrenade(registry: ExtensionRegistry): DependencyState {
  const extension = registry.getExtension(FLAVOR_GRENADE_EXTENSION_ID);
  if (extension === undefined) {
    return { id: FLAVOR_GRENADE_EXTENSION_ID, status: "missing" };
  }
  return {
    id: FLAVOR_GRENADE_EXTENSION_ID,
    status: extension.isActive ? "installed-active" : "installed-inactive",
  };
}
