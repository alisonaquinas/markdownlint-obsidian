/**
 * Unit tests for {@link DEFAULT_CONFIG} — phase 7 (standard rule additions).
 *
 * @module tests/unit/config/defaults.phase7.test
 */
import { describe, it, expect } from "bun:test";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { OFM_MD_CONFLICTS } from "../../../src/infrastructure/rules/standard/OFM_MD_CONFLICTS.js";

describe("DEFAULT_CONFIG Phase 7 additions", () => {
  it.each(OFM_MD_CONFLICTS.map((c) => c.code))(
    "disables %s by default (listed in OFM_MD_CONFLICTS)",
    (code) => {
      expect(DEFAULT_CONFIG.rules[code]).toBeDefined();
      expect(DEFAULT_CONFIG.rules[code]?.enabled).toBe(false);
    },
  );

  it("does not disable MD001 (which has no OFM conflict)", () => {
    expect(DEFAULT_CONFIG.rules.MD001).toBeUndefined();
  });

  it("preserves the existing OFM disables (OFM003, OFM062, OFM066, OFM082, OFM120, OFM121)", () => {
    expect(DEFAULT_CONFIG.rules.OFM003?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM062?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM066?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM082?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM120?.enabled).toBe(false);
    expect(DEFAULT_CONFIG.rules.OFM121?.enabled).toBe(false);
  });

  it("exposes exactly the OFM_MD_CONFLICTS list as MD-prefixed defaults", () => {
    const mdKeys = Object.keys(DEFAULT_CONFIG.rules).filter((k) => k.startsWith("MD"));
    expect(mdKeys).toHaveLength(OFM_MD_CONFLICTS.length);
    expect(mdKeys.sort()).toEqual(OFM_MD_CONFLICTS.map((c) => c.code).sort());
  });
});
