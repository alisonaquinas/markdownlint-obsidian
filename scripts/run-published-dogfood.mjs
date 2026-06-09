import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const packageSpec = process.argv[2] ?? "markdownlint-obsidian-cli@latest";
const repoRoot = process.cwd();
const installRoot = mkdtempSync(join(tmpdir(), "markdownlint-obsidian-dogfood-"));

try {
  run(
    npmCommand(),
    npmArgs(["install", "--prefix", installRoot, "--no-save", packageSpec]),
    repoRoot,
  );

  const cliPath = join(installRoot, "node_modules", "markdownlint-obsidian-cli", "dist", "bin.mjs");

  run(process.execPath, [cliPath, "**/*.md"], join(repoRoot, "docs"));
  run(process.execPath, [cliPath, "**/*.md"], join(repoRoot, "extension", "docs"));
} finally {
  rmSync(installRoot, { force: true, recursive: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function npmCommand() {
  return process.env.npm_execpath === undefined ? "npm" : process.execPath;
}

function npmArgs(args) {
  return process.env.npm_execpath === undefined ? args : [process.env.npm_execpath, ...args];
}
