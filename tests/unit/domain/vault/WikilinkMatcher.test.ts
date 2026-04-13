import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import { matchWikilink } from "../../../../src/domain/vault/WikilinkMatcher.js";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";

const ROOT = path.resolve("/vault");
const INDEX = makeVaultPath(ROOT, path.resolve("/vault/notes/index.md"));
const OTHER = makeVaultPath(ROOT, path.resolve("/vault/notes/Other.md"));

describe("matchWikilink", () => {
  const all = [INDEX, OTHER];

  it("exact relative match", () => {
    const r = matchWikilink("notes/index", all, { caseSensitive: false });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.path).toBe(INDEX);
      expect(r.strategy).toBe("exact");
    }
  });

  it("exact match tolerates trailing .md", () => {
    const r = matchWikilink("notes/index.md", all, { caseSensitive: false });
    expect(r.kind).toBe("resolved");
  });

  it("basename match", () => {
    const r = matchWikilink("index", all, { caseSensitive: false });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.path).toBe(INDEX);
      expect(r.strategy).toBe("basename");
    }
  });

  it("case-insensitive match when caseSensitive=false", () => {
    const r = matchWikilink("notes/OTHER", all, { caseSensitive: false });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.path).toBe(OTHER);
      expect(r.strategy).toBe("case-insensitive");
    }
  });

  it("case mismatch rejected when caseSensitive=true", () => {
    const r = matchWikilink("notes/OTHER", all, { caseSensitive: true });
    expect(r.kind).toBe("not-found");
  });

  it("ambiguous basename", () => {
    const A = makeVaultPath(ROOT, path.resolve("/vault/a/same.md"));
    const B = makeVaultPath(ROOT, path.resolve("/vault/b/same.md"));
    const r = matchWikilink("same", [A, B], { caseSensitive: false });
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") {
      expect(r.candidates.length).toBe(2);
    }
  });

  it("not found", () => {
    expect(matchWikilink("missing", all, { caseSensitive: false }).kind).toBe("not-found");
  });

  it("backslash targets normalise to forward slashes", () => {
    const r = matchWikilink("notes\\index", all, { caseSensitive: false });
    expect(r.kind).toBe("resolved");
  });

  it("empty target reports not found", () => {
    expect(matchWikilink("", all, { caseSensitive: false }).kind).toBe("not-found");
  });
});
