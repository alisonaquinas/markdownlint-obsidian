import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const packageSpec = process.argv[2] ?? "markdownlint-obsidian-cli@latest";
const repoRoot = process.cwd();
const installRoot = mkdtempSync(join(tmpdir(), "markdownlint-obsidian-dogfood-"));

try {
  const npm = npmInvocation(["install", "--prefix", installRoot, "--no-save", packageSpec]);
  run(npm.command, npm.args, repoRoot);

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

function npmInvocation(args) {
  const npmCliPath = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(npmCliPath)) {
    return { command: process.execPath, args: [npmCliPath, ...args] };
  }

  return { command: "npm", args };
}
