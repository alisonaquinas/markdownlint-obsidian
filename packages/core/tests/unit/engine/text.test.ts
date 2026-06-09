/**
 * Unit tests for in-memory engine entry points.
 *
 * @module tests/unit/engine/text.test
 */
import { describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fixText, lintText } from "../../../src/engine/index.js";

const LINE_ENDING_REPRO = [
  "# Notice",
  "",
  "> [[domain/ubiquitous-language#notification-group|Notification Group]], which is an email",
  "",
  "> [!INFO] Valid callout",
  "> body",
  "",
  "Paragraph before list",
  "- one",
  "- two",
  "",
  "> [!NOTE]Title",
  "",
].join("\n");

async function makeTmpVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-engine-text-test-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  return dir;
}

describe("engine text APIs", () => {
  it("lints unsaved in-memory document text", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const result = await lintText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: "# Bad tag\n\n#topic/\n",
      });

      expect(result.filePath).toBe(filePath);
      expect(result.errors.some((error) => error.ruleCode === "OFM063")).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("fixes in-memory document text without writing a file", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const outcome = await fixText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: "# Bad tag\n\n#topic/\n",
      });

      expect(outcome.text).toContain("#topic\n");
      await expect(fs.stat(filePath)).rejects.toThrow();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("lints LF and CRLF in-memory text with identical diagnostics", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const lf = await lintText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: LINE_ENDING_REPRO,
      });
      const crlf = await lintText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: LINE_ENDING_REPRO.replace(/\n/g, "\r\n"),
      });

      expect(summarize(crlf)).toEqual(summarize(lf));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("preserves CRLF endings when fixing in-memory text", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const outcome = await fixText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: "# Bad tag\r\n\r\n#topic/\r\n",
      });

      expect(outcome.text).toBe("# Bad tag\r\n\r\n#topic\r\n");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

function summarize(result: Awaited<ReturnType<typeof lintText>>): readonly string[] {
  return result.errors.map((error) => `${error.ruleCode}:${error.line}:${error.column}`);
}
