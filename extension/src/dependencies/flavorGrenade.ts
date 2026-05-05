import { FLAVOR_GRENADE_EXTENSION_ID } from "../shared/constants.js";
import type { DependencyState } from "../shared/types.js";

export interface ExtensionRegistry {
  getExtension(id: string): { readonly isActive: boolean } | undefined;
}

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
