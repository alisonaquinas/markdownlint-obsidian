import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;

beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-md-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
});

afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

// Each test spawns the full CLI binary; Windows cold-starts take 3-5s, so
// this suite runs with a generous timeout to avoid flakes under parallel
// execution.
describe("standard MD integration", { timeout: 20000 }, () => {
  it("MD001 (heading-increment) fires on a skipped heading level", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# h1\n\n### h3 (skips h2)\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("MD001");
  });

  it("MD013 (line-length) is disabled by default so long wikilinks pass", async () => {
    const longLink =
      "[[very/long/path/that/would/normally/fail/md013/but/should/pass/in/ofm/vaults]]";
    await fs.writeFile(
      path.join(vault, "note.md"),
      `# h\n\nPrelude text. ${longLink}\n`,
    );
    // --no-resolve suppresses OFM001 so the only failure surface is an
    // (absent) MD013 violation. Keeps the assertion focused on Phase 7.
    const r = await spawnCli(["**/*.md", "--no-resolve"], vault);
    expect(r.stdout).not.toContain("MD013");
    expect(r.exitCode).toBe(0);
  });

  it("MD033 (no-inline-html) is disabled by default so OFM callouts pass", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# h\n\n<details><summary>x</summary>y</details>\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.stdout).not.toContain("MD033");
  });

  it("MD034 (no-bare-urls) is disabled by default so bare links pass", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# h\n\nSee https://example.com for details.\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.stdout).not.toContain("MD034");
  });

  it("MD041 (first-line-heading) is disabled so frontmatter-only notes pass", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "---\ntitle: Frontmatter-only\n---\n\nBody text without a top heading.\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.stdout).not.toContain("MD041");
  });

  it("MD042 (no-empty-links) is disabled so wikilinks pass", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# h\n\nA [[link]] to another note.\n",
    );
    const r = await spawnCli(["**/*.md", "--no-resolve"], vault);
    expect(r.stdout).not.toContain("MD042");
  });

  it("MD018 (no-missing-space-atx) is disabled so line-leading tags pass", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# h\n\n#project tag at start of line.\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.stdout).not.toContain("MD018");
  });
});
