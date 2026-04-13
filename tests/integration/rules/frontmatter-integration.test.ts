import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fm-int-"));
  await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
  await fs.writeFile(
    path.join(tmp, ".obsidian-linter.jsonc"),
    JSON.stringify({
      frontmatter: {
        required: ["tags"],
        dateFields: ["created"],
        typeMap: {},
        allowUnknown: true,
      },
    }),
  );
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

// CLI spawns are slow on Windows under parallel execution; 15s gives the
// runner enough headroom for the slowest cold-start case.
describe("frontmatter rules integration", () => {
  it("fails when required key missing", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/frontmatter/missing-tags.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM080");
  });

  it("fails on invalid date", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/frontmatter/invalid-date.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM081");
  });

  it("passes for valid file", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/frontmatter/valid.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
  });
});
