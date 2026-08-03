import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { fileURLToPath } from "node:url";

const execAsync = promisify(execFile);
const BIN = fileURLToPath(new URL("../../../bin/markdownlint-obsidian.js", import.meta.url));
const BUN = process.execPath;

// Stand up a tiny vault with one broken wikilink so each formatter has
// at least one lint error to render. The broken wikilink points at a
// file that does not exist, tripping OFM001.
describe("CLI formatter wiring", () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fmt-"));
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.mkdir(path.join(tmp, ".git"), { recursive: true });
    await fs.mkdir(path.join(tmp, "docs"), { recursive: true });
    await fs.writeFile(path.join(tmp, "broken.md"), "# Broken\n\n[[does-not-exist]]\n");
    await fs.writeFile(path.join(tmp, "docs", "nested.md"), "# Nested\n\n[[does-not-exist]]\n");
  });

  afterAll(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  async function runCli(
    formatter: string,
    cwd = tmp,
    glob = "broken.md",
  ): Promise<{ stdout: string; code: number }> {
    try {
      const { stdout } = await execAsync(BUN, [BIN, "--output-formatter", formatter, glob], {
        cwd,
      });
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

  for (const formatter of ["codeclimate", "gitlab-code-quality"]) {
    it(`${formatter} formatter emits a GitLab Code Quality array`, async () => {
      const { stdout, code } = await runCli(formatter);
      const parsed = JSON.parse(stdout) as Array<{
        description: string;
        check_name: string;
        fingerprint: string;
        severity: string;
        location: { path: string; lines: { begin: number } };
      }>;

      expect(code).toBe(1);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      const issue = parsed[0]!;
      expect(issue.description).toContain("OFM001");
      expect(issue.check_name).toMatch(/^OFM001\//);
      expect(issue.fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(issue.severity).toBe("major");
      expect(issue.location.path).toBe("broken.md");
      expect(issue.location.path).not.toContain("\\");
      expect(issue.location.lines.begin).toBeGreaterThan(0);
    });
  }

  it("keeps paths and fingerprints repository-relative from a nested cwd", async () => {
    const fromRoot = await runCli("codeclimate", tmp, "docs/nested.md");
    const fromNested = await runCli("codeclimate", path.join(tmp, "docs"), "nested.md");
    const rootIssue = (
      JSON.parse(fromRoot.stdout) as Array<{
        fingerprint: string;
        location: { path: string };
      }>
    )[0];
    const nestedIssue = (
      JSON.parse(fromNested.stdout) as Array<{
        fingerprint: string;
        location: { path: string };
      }>
    )[0];

    expect(rootIssue?.location.path).toBe("docs/nested.md");
    expect(nestedIssue?.location.path).toBe("docs/nested.md");
    expect(nestedIssue?.fingerprint).toBe(rootIssue?.fingerprint);
  });
});
