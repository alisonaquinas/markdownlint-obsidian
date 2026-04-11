import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-co-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("callout rules integration", { timeout: 20000 }, () => {
  it("known callout type passes", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "> [!NOTE] Title\n> body\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("unknown callout type reports OFM040", async () => {
    const cfg = {
      callouts: {
        allowList: ["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"],
        caseSensitive: false,
        requireTitle: false,
        allowFold: true,
      },
    };
    await fs.writeFile(path.join(vault, ".obsidian-linter.jsonc"), JSON.stringify(cfg));
    await fs.writeFile(path.join(vault, "note.md"), "> [!CUSTOM] Title\n> body\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM040");
  });

  it("custom type allowed via config exits 0", async () => {
    const cfg = {
      callouts: {
        allowList: ["NOTE", "CUSTOM"],
        caseSensitive: false,
        requireTitle: false,
        allowFold: true,
      },
    };
    await fs.writeFile(path.join(vault, ".obsidian-linter.jsonc"), JSON.stringify(cfg));
    await fs.writeFile(path.join(vault, "note.md"), "> [!CUSTOM] Title\n> body\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("malformed callout header reports OFM041", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "> [!NOTE]Title\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM041");
  });
});
