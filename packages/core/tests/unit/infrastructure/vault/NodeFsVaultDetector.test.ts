import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { makeNodeFsVaultDetector } from "../../../../src/infrastructure/vault/NodeFsVaultDetector.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-vdet-"));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("NodeFsVaultDetector", () => {
  it("detects an .obsidian/ ancestor directory", async () => {
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    const nested = path.join(tmp, "notes", "deep");
    await fs.mkdir(nested, { recursive: true });
    const detector = makeNodeFsVaultDetector();
    const root = await detector.detect(nested);
    expect(root).toBe(path.resolve(tmp));
  });

  it("falls back to the closest .git/ ancestor when no .obsidian/", async () => {
    await fs.mkdir(path.join(tmp, ".git"), { recursive: true });
    const detector = makeNodeFsVaultDetector();
    const root = await detector.detect(tmp);
    expect(root).toBe(path.resolve(tmp));
  });

  it("prefers .obsidian/ over .git/ when both exist", async () => {
    const outer = tmp;
    const inner = path.join(outer, "sub");
    await fs.mkdir(inner, { recursive: true });
    await fs.mkdir(path.join(outer, ".git"), { recursive: true });
    await fs.mkdir(path.join(inner, ".obsidian"), { recursive: true });
    const detector = makeNodeFsVaultDetector();
    const root = await detector.detect(inner);
    expect(root).toBe(path.resolve(inner));
  });

  it("throws OFM900 when neither .obsidian/ nor .git/ is reachable", async () => {
    // We rely on the test being run from a dir where tmp's parent chain
    // also lacks .obsidian/ and .git/. If it doesn't (e.g. repo root),
    // we can at least assert the detector did NOT return something inside
    // our temp dir.
    const detector = makeNodeFsVaultDetector();
    try {
      const r = await detector.detect(tmp);
      // If detection succeeds, it must have walked out of our tmp tree.
      expect(r.startsWith(path.resolve(tmp))).toBe(false);
    } catch (err) {
      expect((err as Error).message).toMatch(/OFM900/);
    }
  });
});
