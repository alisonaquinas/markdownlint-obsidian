/**
 * Unit coverage for Flavor Grenade dependency detection.
 *
 * The extension uses this state for eligibility and messaging, not for lint
 * engine behavior.
 */

import { describe, expect, it } from "bun:test";
import { detectFlavorGrenade } from "../../src/dependencies/flavorGrenade.js";
import { FLAVOR_GRENADE_EXTENSION_ID } from "../../src/shared/constants.js";

describe("detectFlavorGrenade", () => {
  it("reports missing dependency", () => {
    const state = detectFlavorGrenade({ getExtension: () => undefined });

    expect(state).toEqual({
      id: FLAVOR_GRENADE_EXTENSION_ID,
      status: "missing",
      reason: "Flavor Grenade extension is missing",
    });
  });

  it("reports active dependency", () => {
    const state = detectFlavorGrenade({ getExtension: () => ({ isActive: true }) });

    expect(state.status).toBe("installed-active");
    expect(state.reason).toBeNull();
  });

  it("reports inactive dependency with a visible reason", () => {
    const state = detectFlavorGrenade({ getExtension: () => ({ isActive: false }) });

    expect(state.status).toBe("installed-inactive");
    expect(state.reason).toBe("Flavor Grenade extension is installed but inactive");
  });

  it("reports restricted-mode startup block when dependency is installed", () => {
    const state = detectFlavorGrenade(
      { getExtension: () => ({ isActive: false }) },
      { isTrusted: false, workspaceFolderSchemes: ["file"] },
    );

    expect(state.status).toBe("blocked-restricted");
    expect(state.reason).toBe("Flavor Grenade is disabled in Restricted Mode");
  });

  it("reports virtual workspace startup block when every folder is non-file", () => {
    const state = detectFlavorGrenade(
      { getExtension: () => ({ isActive: true }) },
      { isTrusted: true, workspaceFolderSchemes: ["vscode-vfs"] },
    );

    expect(state.status).toBe("blocked-virtual");
    expect(state.reason).toBe("Flavor Grenade requires file-backed workspace folders");
  });
});
