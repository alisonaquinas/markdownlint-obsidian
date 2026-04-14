/**
 * Unit tests for {@link buildBlockRefIndex}.
 *
 * @module tests/unit/infrastructure/vault/BlockRefIndexBuilder.test
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { buildBlockRefIndex } from "../../../../src/infrastructure/vault/BlockRefIndexBuilder.js";
import { makeMarkdownItParser } from "../../../../src/infrastructure/parser/MarkdownItParser.js";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";
import type { VaultPath } from "../../../../src/domain/vault/VaultPath.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-brefidx-"));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writeVaultFile(rel: string, body: string): Promise<VaultPath> {
  const abs = path.join(tmp, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, body);
  return makeVaultPath(tmp, abs);
}

const readFile = async (abs: string): Promise<string> => fs.readFile(abs, "utf-8");

describe("buildBlockRefIndex", () => {
  it("indexes block ids across multiple files", async () => {
    const a = await writeVaultFile("a.md", "# A\n\nOne paragraph ^one\n");
    const b = await writeVaultFile("b.md", "# B\n\nAnother line ^top\n");
    const parser = makeMarkdownItParser();
    const idx = await buildBlockRefIndex([a, b], { parser, readFile });
    expect(idx.has("a", "one")).toBe(true);
    expect(idx.has("b", "top")).toBe(true);
    expect(idx.has("a", "top")).toBe(false);
  });

  it("records duplicate block ids per page", async () => {
    const b = await writeVaultFile("b.md", "line ^one\n\nother ^one\n");
    const parser = makeMarkdownItParser();
    const idx = await buildBlockRefIndex([b], { parser, readFile });
    expect(idx.duplicatesIn("b.md")).toEqual(["one"]);
  });

  it("silently skips files that fail to read", async () => {
    const a = await writeVaultFile("a.md", "line ^real\n");
    const bogus: VaultPath = Object.freeze({
      relative: "missing.md",
      absolute: path.join(tmp, "does-not-exist.md"),
      stem: "missing",
    });
    const parser = makeMarkdownItParser();
    const idx = await buildBlockRefIndex([a, bogus], { parser, readFile });
    expect(idx.has("a", "real")).toBe(true);
    expect(idx.all().has("missing.md")).toBe(false);
  });

  it("returns an empty index for an empty vault", async () => {
    const parser = makeMarkdownItParser();
    const idx = await buildBlockRefIndex([], { parser, readFile });
    expect(idx.all().size).toBe(0);
  });
});
