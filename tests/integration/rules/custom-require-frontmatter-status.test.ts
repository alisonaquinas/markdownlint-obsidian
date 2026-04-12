import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

const RULE_PATH = path.resolve("examples/rules/require-frontmatter-status.ts");

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cr1-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.writeFile(
    path.join(vault, ".obsidian-linter.jsonc"),
    JSON.stringify({ customRules: [RULE_PATH] }),
  );
});
afterEach(async () => { await fs.rm(vault, { recursive: true, force: true }); });

describe("custom rule: require-frontmatter-status", { timeout: 20000 }, () => {
  it("passes when status is a valid value", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "---\nstatus: draft\n---\n\nbody\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("fails when status key is missing", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "---\ntitle: hi\n---\n\nbody\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("CUSTOM001");
    expect(r.stdout).toContain("Missing frontmatter key");
  });

  it("fails when status value is not in the allowed set", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "---\nstatus: unknown\n---\n\nbody\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("CUSTOM001");
    expect(r.stdout).toContain("draft, review, published, archived");
  });
});
