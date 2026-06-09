/**
 * Unit tests for {@link makeVaultPath}.
 *
 * @module tests/unit/domain/vault/VaultPath.test
 */
import { describe, it, expect } from "bun:test";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";

describe("VaultPath", () => {
  it("computes relative, absolute, and stem", () => {
    const abs = "/vault/notes/index.md";
    const p = makeVaultPath("notes/index.md", abs);
    expect(p.relative).toBe("notes/index.md");
    expect(p.absolute).toBe(abs);
    expect(p.stem).toBe("index");
  });

  it("throws if relative path escapes vault", () => {
    expect(() => makeVaultPath("../other/x.md", "/other/x.md")).toThrow(/invalid/);
  });

  it("normalizes path separators to forward slashes in relative form", () => {
    const p = makeVaultPath("notes\\sub\\index.md", "/vault/notes/sub/index.md");
    expect(p.relative).toBe("notes/sub/index.md");
  });

  it("rejects empty relative path", () => {
    expect(() => makeVaultPath("", "/vault")).toThrow(/invalid/);
  });
});
