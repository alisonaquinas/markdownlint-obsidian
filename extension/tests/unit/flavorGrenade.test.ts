import { describe, expect, it } from "bun:test";
import { detectFlavorGrenade } from "../../src/dependencies/flavorGrenade.js";
import { FLAVOR_GRENADE_EXTENSION_ID } from "../../src/shared/constants.js";

describe("detectFlavorGrenade", () => {
  it("reports missing dependency", () => {
    const state = detectFlavorGrenade({ getExtension: () => undefined });

    expect(state).toEqual({ id: FLAVOR_GRENADE_EXTENSION_ID, status: "missing" });
  });

  it("reports active dependency", () => {
    const state = detectFlavorGrenade({ getExtension: () => ({ isActive: true }) });

    expect(state.status).toBe("installed-active");
  });
});
