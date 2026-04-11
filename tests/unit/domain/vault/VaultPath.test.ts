import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";

describe("VaultPath", () => {
  it("computes relative, absolute, and stem", () => {
    const root = path.resolve("/vault");
    const abs = path.resolve("/vault/notes/index.md");
    const p = makeVaultPath(root, abs);
    expect(p.relative).toBe("notes/index.md");
    expect(p.absolute).toBe(abs);
    expect(p.stem).toBe("index");
  });

  it("throws if file is outside vault", () => {
    expect(() => makeVaultPath(path.resolve("/vault"), path.resolve("/other/x.md"))).toThrow(
      /outside/,
    );
  });

  it("normalizes path separators to forward slashes in relative form", () => {
    const root = path.resolve("/vault");
    const abs = path.resolve("/vault/notes/sub/index.md");
    const p = makeVaultPath(root, abs);
    expect(p.relative).toBe("notes/sub/index.md");
  });

  it("rejects when abs equals vault root", () => {
    const root = path.resolve("/vault");
    expect(() => makeVaultPath(root, root)).toThrow(/outside/);
  });
});
