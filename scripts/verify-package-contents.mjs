#!/usr/bin/env node
/**
 * Purpose: Verify npm tarball contents before publish.
 *
 * Provides: package-level `npm pack --dry-run --json` assertions for core and CLI.
 *
 * Role in system: Runs in CI and `bun run test:packaging` to catch missing
 * runtime files, missing LICENSE files, agent-only documentation leaks, and a
 * broken CLI bin shebang before release.
 *
 * Constraints: Uses npm's pack metadata instead of filesystem globs so the
 * check reflects the actual package `files` rules consumers receive.
 */
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
  // On Windows, npm is commonly a .cmd shim; running through cmd.exe keeps the
  // packaging check usable in the same local shell developers use for releases.
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
    // `files` entries can include nested paths, so test suffixes rather than
    // just basenames to catch `src/AGENTS.md` and similar agent-only leaks.
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
