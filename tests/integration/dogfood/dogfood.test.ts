import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import * as path from "node:path";

const execAsync = promisify(execFile);
const BIN = path.resolve("bin/markdownlint-obsidian.js");
const TSX_URL = pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href;
const NODE_ARGS = ["--import", TSX_URL, BIN];

describe("dogfood", () => {
  it("docs/ directory passes the linter (Phase 1: no rules active)", async () => {
    const result = await execAsync("node", [...NODE_ARGS, "**/*.md"], {
      cwd: path.resolve("docs"),
    }).catch((e: unknown) => {
      const err = e as { code?: number; stdout?: string; stderr?: string };
      return { exitCode: err.code ?? 2, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
    });
    const exitCode = "exitCode" in result ? result.exitCode : 0;
    expect(exitCode).toBe(0);
  });
});
