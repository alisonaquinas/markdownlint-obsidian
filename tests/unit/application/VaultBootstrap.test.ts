import { describe, it, expect, vi } from "vitest";
import { bootstrapVault } from "../../../src/application/VaultBootstrap.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import type { VaultIndex } from "../../../src/domain/vault/VaultIndex.js";
import type { LinterConfig } from "../../../src/domain/config/LinterConfig.js";

function stubIndex(root = "/stub"): VaultIndex {
  return Object.freeze({
    root,
    all: () => [],
    has: () => false,
    resolve: () => ({ kind: "not-found" as const }),
  });
}

describe("bootstrapVault", () => {
  it("returns null when resolve is disabled", async () => {
    const cfg: LinterConfig = { ...DEFAULT_CONFIG, resolve: false };
    const detector = { detect: vi.fn() };
    const buildIndex = vi.fn();
    const result = await bootstrapVault("/wherever", cfg, {
      detector,
      buildIndex,
    });
    expect(result).toBeNull();
    expect(detector.detect).not.toHaveBeenCalled();
    expect(buildIndex).not.toHaveBeenCalled();
  });

  it("config.vaultRoot override bypasses detector", async () => {
    const cfg: LinterConfig = { ...DEFAULT_CONFIG, vaultRoot: "/override" };
    const detector = { detect: vi.fn() };
    const idx = stubIndex("/override");
    const buildIndex = vi.fn().mockResolvedValue(idx);
    const result = await bootstrapVault("/start", cfg, { detector, buildIndex });
    expect(result).toBe(idx);
    expect(detector.detect).not.toHaveBeenCalled();
    expect(buildIndex).toHaveBeenCalledWith("/override", { caseSensitive: false });
  });

  it("runs the detector when no override", async () => {
    const cfg: LinterConfig = DEFAULT_CONFIG;
    const detector = { detect: vi.fn().mockResolvedValue("/detected") };
    const idx = stubIndex("/detected");
    const buildIndex = vi.fn().mockResolvedValue(idx);
    const result = await bootstrapVault("/start", cfg, { detector, buildIndex });
    expect(detector.detect).toHaveBeenCalledWith("/start");
    expect(buildIndex).toHaveBeenCalledWith("/detected", { caseSensitive: false });
    expect(result).toBe(idx);
  });

  it("propagates detector errors (OFM900)", async () => {
    const cfg: LinterConfig = DEFAULT_CONFIG;
    const detector = {
      detect: vi.fn().mockRejectedValue(new Error("OFM900: no vault root found")),
    };
    const buildIndex = vi.fn();
    await expect(bootstrapVault("/start", cfg, { detector, buildIndex })).rejects.toThrow(
      /OFM900/,
    );
    expect(buildIndex).not.toHaveBeenCalled();
  });

  it("passes caseSensitive from wikilinks config to the index builder", async () => {
    const cfg: LinterConfig = {
      ...DEFAULT_CONFIG,
      wikilinks: { caseSensitive: true, allowAlias: true },
    };
    const detector = { detect: vi.fn().mockResolvedValue("/v") };
    const buildIndex = vi.fn().mockResolvedValue(stubIndex("/v"));
    await bootstrapVault("/s", cfg, { detector, buildIndex });
    expect(buildIndex).toHaveBeenCalledWith("/v", { caseSensitive: true });
  });
});
