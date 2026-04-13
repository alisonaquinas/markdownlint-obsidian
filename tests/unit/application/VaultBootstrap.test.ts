import { describe, it, expect, vi } from "bun:test";
import { bootstrapVault } from "../../../src/application/VaultBootstrap.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import type { VaultIndex } from "../../../src/domain/vault/VaultIndex.js";
import type { LinterConfig } from "../../../src/domain/config/LinterConfig.js";
import { makeBlockRefIndex, type BlockRefIndex } from "../../../src/domain/vault/BlockRefIndex.js";

function stubIndex(root = "/stub"): VaultIndex {
  return Object.freeze({
    root,
    all: () => [],
    has: () => false,
    resolve: () => ({ kind: "not-found" as const }),
  });
}

function stubBlockRefs(): BlockRefIndex {
  return makeBlockRefIndex(new Map());
}

describe("bootstrapVault", () => {
  it("returns null when resolve is disabled", async () => {
    const cfg: LinterConfig = { ...DEFAULT_CONFIG, resolve: false };
    const detector = { detect: vi.fn() };
    const buildIndex = vi.fn();
    const buildBlockRefIndex = vi.fn();
    const result = await bootstrapVault("/wherever", cfg, {
      detector,
      buildIndex,
      buildBlockRefIndex,
    });
    expect(result).toBeNull();
    expect(detector.detect).not.toHaveBeenCalled();
    expect(buildIndex).not.toHaveBeenCalled();
    expect(buildBlockRefIndex).not.toHaveBeenCalled();
  });

  it("config.vaultRoot override bypasses detector", async () => {
    const cfg: LinterConfig = { ...DEFAULT_CONFIG, vaultRoot: "/override" };
    const detector = { detect: vi.fn() };
    const idx = stubIndex("/override");
    const refs = stubBlockRefs();
    const buildIndex = vi.fn().mockResolvedValue(idx);
    const buildBlockRefIndex = vi.fn().mockResolvedValue(refs);
    const result = await bootstrapVault("/start", cfg, {
      detector,
      buildIndex,
      buildBlockRefIndex,
    });
    expect(result).toEqual({ vault: idx, blockRefs: refs });
    expect(detector.detect).not.toHaveBeenCalled();
    expect(buildIndex).toHaveBeenCalledWith("/override", { caseSensitive: false });
    expect(buildBlockRefIndex).toHaveBeenCalledTimes(1);
  });

  it("runs the detector when no override", async () => {
    const cfg: LinterConfig = DEFAULT_CONFIG;
    const detector = { detect: vi.fn().mockResolvedValue("/detected") };
    const idx = stubIndex("/detected");
    const refs = stubBlockRefs();
    const buildIndex = vi.fn().mockResolvedValue(idx);
    const buildBlockRefIndex = vi.fn().mockResolvedValue(refs);
    const result = await bootstrapVault("/start", cfg, {
      detector,
      buildIndex,
      buildBlockRefIndex,
    });
    expect(detector.detect).toHaveBeenCalledWith("/start");
    expect(buildIndex).toHaveBeenCalledWith("/detected", { caseSensitive: false });
    expect(result?.vault).toBe(idx);
    expect(result?.blockRefs).toBe(refs);
  });

  it("propagates detector errors (OFM900)", async () => {
    const cfg: LinterConfig = DEFAULT_CONFIG;
    const detector = {
      detect: vi.fn().mockRejectedValue(new Error("OFM900: no vault root found")),
    };
    const buildIndex = vi.fn();
    const buildBlockRefIndex = vi.fn();
    await expect(
      bootstrapVault("/start", cfg, { detector, buildIndex, buildBlockRefIndex }),
    ).rejects.toThrow(/OFM900/);
    expect(buildIndex).not.toHaveBeenCalled();
    expect(buildBlockRefIndex).not.toHaveBeenCalled();
  });

  it("passes caseSensitive from wikilinks config to the index builder", async () => {
    const cfg: LinterConfig = {
      ...DEFAULT_CONFIG,
      wikilinks: { caseSensitive: true, allowAlias: true },
    };
    const detector = { detect: vi.fn().mockResolvedValue("/v") };
    const buildIndex = vi.fn().mockResolvedValue(stubIndex("/v"));
    const buildBlockRefIndex = vi.fn().mockResolvedValue(stubBlockRefs());
    await bootstrapVault("/s", cfg, { detector, buildIndex, buildBlockRefIndex });
    expect(buildIndex).toHaveBeenCalledWith("/v", { caseSensitive: true });
  });

  it("invokes buildBlockRefIndex with the file list from the vault", async () => {
    const cfg: LinterConfig = DEFAULT_CONFIG;
    const files = [Object.freeze({ relative: "a.md", absolute: "/v/a.md", stem: "a" })];
    const idx: VaultIndex = Object.freeze({
      root: "/v",
      all: () => files,
      has: () => true,
      resolve: () => ({ kind: "not-found" as const }),
    });
    const detector = { detect: vi.fn().mockResolvedValue("/v") };
    const buildIndex = vi.fn().mockResolvedValue(idx);
    const buildBlockRefIndex = vi.fn().mockResolvedValue(stubBlockRefs());
    await bootstrapVault("/s", cfg, { detector, buildIndex, buildBlockRefIndex });
    expect(buildBlockRefIndex).toHaveBeenCalledWith(files);
  });
});
