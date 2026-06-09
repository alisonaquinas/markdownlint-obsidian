/**
 * Unit tests for the public editor API subpath.
 *
 * @module tests/unit/public/editor.test
 */
import { describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fixText, lintText } from "../../../src/public/editor.js";

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
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-editor-test-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  return dir;
}

describe("public editor API", () => {
  it("lints LF and CRLF text with identical diagnostics", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const base = {
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
      };
      const lf = await lintText({ ...base, text: LINE_ENDING_REPRO });
      const crlf = await lintText({ ...base, text: LINE_ENDING_REPRO.replace(/\n/g, "\r\n") });

      expect(summarize(crlf)).toEqual(summarize(lf));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("preserves CRLF endings when fixing text", async () => {
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
