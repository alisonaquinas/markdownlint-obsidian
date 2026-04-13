import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

const RULE_PATH = path.resolve("examples/rules/banned-wikilink-targets.ts");

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cr2-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.writeFile(
    path.join(vault, ".obsidian-linter.jsonc"),
    JSON.stringify({
      customRules: [RULE_PATH],
      rules: { OFM001: { enabled: false } },
    }),
  );
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("custom rule: banned-wikilink-targets", { timeout: 20000 }, () => {
  it("passes when no banned targets are linked", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "# Hi\n\nSee [[allowed-page]].\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("fails when a banned target is linked", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "# Hi\n\nSee [[wiki/deprecated]] for info.\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("CUSTOM002");
    expect(r.stdout).toContain("wiki/deprecated");
  });

  it("fails for each occurrence of a banned target", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# Hi\n\n[[wiki/deprecated]] and [[drafts/private]].\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    const matches = r.stdout.match(/CUSTOM002/g) ?? [];
    expect(matches.length).toBe(2);
  });
});
