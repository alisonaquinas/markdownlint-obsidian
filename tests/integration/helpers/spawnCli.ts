import { spawn } from "node:child_process";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export interface SpawnResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const BIN = path.resolve("bin/markdownlint-obsidian.js");
const TSX_LOADER_URL = pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href;

/**
 * Run the markdownlint-obsidian binary with the given args in `cwd`.
 *
 * Uses node:child_process.spawn with an argv array (no shell), via the
 * tsx loader so the TypeScript entry point is importable. The wrapper
 * resolves with a SpawnResult once the process closes; non-zero exits
 * resolve normally so callers can assert on `exitCode`.
 *
 * @param args - CLI arguments to pass to the binary.
 * @param cwd - Working directory for the spawned process.
 * @returns A promise resolving to the captured stdout, stderr, and exit code.
 */
export function spawnCli(args: readonly string[], cwd: string): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", TSX_LOADER_URL, BIN, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}
