/**
 * Unit tests for {@link fix} engine entry-point.
 *
 * @module tests/unit/engine/fix.test
 */
import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { fix } from "../../../src/engine/index.js";

/** Create a temp dir with a .obsidian/ marker so vault detection succeeds. */
async function makeTmpVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-engine-fix-test-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  return dir;
}

describe("engine.fix()", () => {
  it("returns FixOutcome with firstPass and finalPass arrays", async () => {
    const tmpDir = await makeTmpVault();
    try {
      await fs.writeFile(path.join(tmpDir, "file.md"), "# Hello\n\nContent.\n");
      const outcome = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      expect("firstPass" in outcome).toBe(true);
      expect("finalPass" in outcome).toBe(true);
      expect("filesFixed" in outcome).toBe(true);
      expect("conflicts" in outcome).toBe(true);
      expect(Array.isArray(outcome.firstPass)).toBe(true);
      expect(Array.isArray(outcome.finalPass)).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("does not write files when check=true", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const content = "# Hello\n\nContent.\n";
      const filePath = path.join(tmpDir, "file.md");
      await fs.writeFile(filePath, content);
      await fix({ globs: ["**/*.md"], cwd: tmpDir, check: true });
      const afterContent = await fs.readFile(filePath, "utf8");
      expect(afterContent).toBe(content);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("preserves CRLF line endings when fixing file-backed Markdown", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const content = "# Hello\r\n\r\nBody #tag/\r\n";
      const filePath = path.join(tmpDir, "file.md");
      await fs.writeFile(filePath, content);

      const outcome = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const afterContent = await fs.readFile(filePath, "utf8");

      expect(outcome.filesFixed).toHaveLength(1);
      expect(path.basename(outcome.filesFixed[0] ?? "")).toBe("file.md");
      expect(afterContent).toBe("# Hello\r\n\r\nBody #tag\r\n");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns an empty firstPass when no files match", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const outcome = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      expect(outcome.firstPass).toHaveLength(0);
      expect(outcome.finalPass).toHaveLength(0);
      expect(outcome.filesFixed).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("converges in one pass for indented lists attached to colon-terminated prose", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "bug.md");
      await fs.writeFile(filePath, bddListBlock());

      const first = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const afterFirst = await fs.readFile(filePath, "utf8");
      const second = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const afterSecond = await fs.readFile(filePath, "utf8");

      expect(first.conflicts).toHaveLength(0);
      expect(first.finalPass.flatMap((result) => result.errors)).toHaveLength(0);
      expect(second.filesFixed).toHaveLength(0);
      expect(second.finalPass.flatMap((result) => result.errors)).toHaveLength(0);
      expect(afterSecond).toBe(afterFirst);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("does not diverge when multiple colon-attached list blocks are fixed together", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "many.md");
      await fs.writeFile(
        filePath,
        ["# Title", "", ...Array.from({ length: 5 }, bddListBodyBlock)].join("\n"),
      );

      const first = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const afterFirst = await fs.readFile(filePath, "utf8");
      const second = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const afterSecond = await fs.readFile(filePath, "utf8");

      expect(first.conflicts).toHaveLength(0);
      expect(first.finalPass.flatMap((result) => result.errors)).toHaveLength(0);
      expect(second.filesFixed).toHaveLength(0);
      expect(second.finalPass.flatMap((result) => result.errors)).toHaveLength(0);
      expect(afterSecond).toBe(afterFirst);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("applies blockquote marker trailing-space fixes correctly (guard does not over-block)", async () => {
    // validateTrailingFix in FixUseCase rejects MD009 deletions whose
    // span is not trailing on the absolute line — the guard that stops
    // virtual-coordinate corruption ("> the" -> ">the" on the line after
    // a lazily-continued blockquote marker). Genuine marker fixes
    // ("> " -> ">") are trailing deletions and must keep flowing.
    const tmpDir = await makeTmpVault();
    try {
      const content = "---\ntitle: t\n---\n> 2025-05-30\n> \n> the best way\n> \n> so I built it\n";
      const expected = "---\ntitle: t\n---\n> 2025-05-30\n>\n> the best way\n>\n> so I built it\n";
      const filePath = path.join(tmpDir, "bq.md");
      await fs.writeFile(filePath, content);
      const outcome = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const after = await fs.readFile(filePath, "utf8");
      expect(after).toBe(expected);
      expect(outcome.filesFixed).toHaveLength(1);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("still applies genuine trailing-space fixes", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const content = "plain line with trailing spaces   \n";
      const filePath = path.join(tmpDir, "plain.md");
      await fs.writeFile(filePath, content);
      const outcome = await fix({ globs: ["**/*.md"], cwd: tmpDir });
      const after = await fs.readFile(filePath, "utf8");
      expect(after).toBe("plain line with trailing spaces\n");
      expect(outcome.filesFixed).toHaveLength(1);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

function bddListBlock(): string {
  return ["# Title", "", ...bddListBodyBlock().split("\n")].join("\n");
}

function bddListBodyBlock(): string {
  return [
    "**When** an `OPTIONS` preflight is sent with:",
    "  - `Origin: https://attacker.example.com`",
    "  - `Access-Control-Request-Method: PUT`",
    "**Then** the response omits `Access-Control-Allow-Origin`",
    "",
  ].join("\n");
}
