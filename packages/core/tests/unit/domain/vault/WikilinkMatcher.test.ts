/**
 * Unit tests for {@link matchWikilink}.
 *
 * @module tests/unit/domain/vault/WikilinkMatcher.test
 */
import { describe, it, expect } from "bun:test";
import { matchWikilink } from "../../../../src/domain/vault/WikilinkMatcher.js";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";

const INDEX = makeVaultPath("notes/index.md", "/vault/notes/index.md");
const OTHER = makeVaultPath("notes/Other.md", "/vault/notes/Other.md");

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
    const A = makeVaultPath("a/same.md", "/vault/a/same.md");
    const B = makeVaultPath("b/same.md", "/vault/b/same.md");
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

describe("matchWikilink — obsidian-fuzzy resolveMode (issue #27)", () => {
  const WIKI_SOURCES_FOO = makeVaultPath("wiki/sources/foo.md", "/m/wiki/sources/foo.md");
  const RAW_OTHER = makeVaultPath("raw/upnote/Other.md", "/m/raw/upnote/Other.md");
  const SUPER_FOO = makeVaultPath("super-sources/foo.md", "/m/super-sources/foo.md");
  const ALSO_SOURCES_FOO = makeVaultPath("other/sources/foo.md", "/m/other/sources/foo.md");

  it("path-suffix match: [[sources/foo]] resolves to wiki/sources/foo.md", () => {
    const r = matchWikilink("sources/foo", [WIKI_SOURCES_FOO, RAW_OTHER], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.path).toBe(WIKI_SOURCES_FOO);
      expect(r.strategy).toBe("path-suffix");
    }
  });

  it("path-suffix only matches on / boundaries (super-sources/foo does not match)", () => {
    const r = matchWikilink("sources/foo", [SUPER_FOO], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("not-found");
  });

  it("path-suffix reports ambiguous when multiple files end with the suffix", () => {
    const r = matchWikilink("sources/foo", [WIKI_SOURCES_FOO, ALSO_SOURCES_FOO], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") {
      expect(r.candidates.length).toBe(2);
    }
  });

  it("vault-absolute links still resolve via exact match in fuzzy mode", () => {
    const r = matchWikilink("wiki/sources/foo", [WIKI_SOURCES_FOO, RAW_OTHER], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.strategy).toBe("exact");
    }
  });

  it("path-relative mode does not perform path-suffix matching", () => {
    const r = matchWikilink("sources/foo", [WIKI_SOURCES_FOO], {
      caseSensitive: false,
      // resolveMode omitted — should behave as "path-relative"
    });
    // Falls through to basename which won't match because target has a slash.
    expect(r.kind).toBe("not-found");
  });

  it("falls through to basename when no path-suffix match exists", () => {
    const BARE = makeVaultPath("wiki/foo.md", "/m/wiki/foo.md");
    const r = matchWikilink("foo", [BARE, WIKI_SOURCES_FOO], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    // Two basename candidates → ambiguous (the fuzzy step found nothing
    // because "foo" without a slash isn't a suffix-with-boundary match).
    expect(r.kind).toBe("ambiguous");
  });

  it("bare targets keep the basename strategy in fuzzy mode", () => {
    const BARE = makeVaultPath("wiki/foo.md", "/m/wiki/foo.md");
    for (const target of ["foo", "foo.md"]) {
      const r = matchWikilink(target, [BARE], {
        caseSensitive: false,
        resolveMode: "obsidian-fuzzy",
      });
      expect(r.kind).toBe("resolved");
      if (r.kind === "resolved") {
        expect(r.strategy).toBe("basename");
      }
    }
  });

  it("bare targets remain ambiguous by basename in fuzzy mode", () => {
    const A = makeVaultPath("wiki/foo.md", "/m/wiki/foo.md");
    const B = makeVaultPath("archive/foo.md", "/m/archive/foo.md");
    const r = matchWikilink("foo", [A, B], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") {
      expect(r.candidates).toEqual([A, B]);
    }
  });

  it("case-insensitive path-suffix match", () => {
    const r = matchWikilink("Sources/FOO", [WIKI_SOURCES_FOO], {
      caseSensitive: false,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.strategy).toBe("path-suffix");
    }
  });

  it("case-sensitive path-suffix rejects mismatched case", () => {
    const r = matchWikilink("Sources/FOO", [WIKI_SOURCES_FOO], {
      caseSensitive: true,
      resolveMode: "obsidian-fuzzy",
    });
    expect(r.kind).toBe("not-found");
  });
});
