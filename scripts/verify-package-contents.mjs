#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const packages = [
  {
    dir: "packages/core",
    required: ["LICENSE", "README.md", "CHANGELOG.md", "dist/src/public/index.js"],
    forbidden: ["AGENTS.md", "CLAUDE.md", "/AGENTS.md", "/CLAUDE.md"],
  },
  {
    dir: "packages/cli",
    required: ["LICENSE", "README.md", "CHANGELOG.md", "dist/bin.mjs"],
    forbidden: ["AGENTS.md", "CLAUDE.md", "/AGENTS.md", "/CLAUDE.md"],
    bin: "dist/bin.mjs",
  },
];

let failed = false;

for (const pkg of packages) {
  const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/c", "npm", "pack", "--dry-run", "--json"]
      : ["pack", "--dry-run", "--json"];
  const raw = execFileSync(command, args, {
    encoding: "utf8",
    cwd: pkg.dir,
  });
  const [metadata] = JSON.parse(raw);
  const paths = metadata.files.map((file) => file.path);

  for (const required of pkg.required) {
    if (!paths.includes(required)) {
      console.error(`${pkg.dir}: missing ${required}`);
      failed = true;
    }
  }

  for (const filePath of paths) {
    if (pkg.forbidden.some((forbidden) => filePath.endsWith(forbidden))) {
      console.error(`${pkg.dir}: forbidden file ${filePath}`);
      failed = true;
    }
  }

  if (pkg.bin !== undefined) {
    const bin = readFileSync(join(pkg.dir, pkg.bin), "utf8");
    if (!bin.startsWith("#!/usr/bin/env node")) {
      console.error(`${pkg.dir}: ${pkg.bin} missing Node shebang`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
