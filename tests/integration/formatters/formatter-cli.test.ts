import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";

const execAsync = promisify(execFile);
const BIN = path.resolve("bin/markdownlint-obsidian.js");
const TSX_URL = pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href;
const NODE_ARGS = ["--import", TSX_URL, BIN];

// Stand up a tiny vault with one broken wikilink so each formatter has
// at least one lint error to render. The broken wikilink points at a
// file that does not exist, tripping OFM001.
describe("CLI formatter wiring", { timeout: 20000 }, () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fmt-"));
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.writeFile(path.join(tmp, "broken.md"), "# Broken\n\n[[does-not-exist]]\n");
  });

  afterAll(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  async function runCli(formatter: string): Promise<{ stdout: string; code: number }> {
    try {
      const { stdout } = await execAsync(
        "node",
        [...NODE_ARGS, "--output-formatter", formatter, "**/*.md"],
        { cwd: tmp },
      );
      return { stdout, code: 0 };
    } catch (err) {
      const e = err as { stdout?: string; code?: number };
      return { stdout: e.stdout ?? "", code: e.code ?? 1 };
    }
  }

  it("default formatter emits file:line:col output", async () => {
    const { stdout } = await runCli("default");
    expect(stdout).toContain("broken.md");
    expect(stdout).toMatch(/OFM00\d/);
  });

  it("json formatter emits a parseable JSON array", async () => {
    const { stdout } = await runCli("json");
    const parsed = JSON.parse(stdout) as Array<{ filePath: string }>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.some((r) => r.filePath.endsWith("broken.md"))).toBe(true);
  });

  it("junit formatter emits parseable XML with a testsuite", async () => {
    const { stdout } = await runCli("junit");
    expect(stdout).toContain("<?xml");
    expect(stdout).toContain("<testsuite");
    expect(stdout).toContain("<failure");
  });

  it("sarif formatter emits SARIF 2.1.0 JSON", async () => {
    const { stdout } = await runCli("sarif");
    const parsed = JSON.parse(stdout) as {
      version: string;
      runs: Array<{ results: unknown[] }>;
    };
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs[0]?.results.length).toBeGreaterThan(0);
  });
});
