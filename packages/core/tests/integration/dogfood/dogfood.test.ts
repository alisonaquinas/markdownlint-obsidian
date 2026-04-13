import { describe, it, expect } from "bun:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";

const execAsync = promisify(execFile);
const BIN = new URL("../../../../cli/bin/markdownlint-obsidian.js", import.meta.url).pathname;
const BUN = process.execPath;

// Dogfood spawns the full CLI with a `docs/**/*.md` glob — 30+ markdown files.
// Under Bun there is no loader overhead, but we still give this a generous budget
// to match the other integration suites.
describe("dogfood", () => {
  it("docs/ directory passes the linter (Phase 1: no rules active)", async () => {
    const result = await execAsync(BUN, [BIN, "**/*.md"], {
      cwd: path.resolve("docs"),
    }).catch((e: unknown) => {
      const err = e as { code?: number; stdout?: string; stderr?: string };
      return { exitCode: err.code ?? 2, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
    });
    const exitCode = "exitCode" in result ? result.exitCode : 0;
    expect(exitCode).toBe(0);
  });
});
