#!/usr/bin/env node
// Rewrite a package's package.json before `npm publish` so the published
// tarball contains real version specifiers instead of Bun/pnpm `workspace:*`
// literals. Optionally rewrite the package name and workspace deps for scoped
// (e.g. GitHub Packages) publishes.
//
// Usage:
//   node scripts/prepare-publish.mjs <pkg-dir> [scope]
//
// Examples:
//   node scripts/prepare-publish.mjs packages/cli
//   node scripts/prepare-publish.mjs packages/cli @alisonaquinas

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [pkgDir, scope] = process.argv.slice(2);
if (!pkgDir) {
  console.error("usage: prepare-publish.mjs <pkg-dir> [scope]");
  process.exit(1);
}

const pkgPath = resolve(pkgDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

// Map every workspace package name → its current version.
const workspaceVersions = new Map();
for (const wsDir of ["packages/core", "packages/cli"]) {
  const wsPkg = JSON.parse(readFileSync(resolve(wsDir, "package.json"), "utf8"));
  workspaceVersions.set(wsPkg.name, wsPkg.version);
}

const depKeys = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

for (const depKey of depKeys) {
  const deps = pkg[depKey];
  if (!deps) continue;
  const rewritten = {};
  for (const [depName, depVersion] of Object.entries(deps)) {
    let finalName = depName;
    let finalVersion = depVersion;
    if (typeof depVersion === "string" && depVersion.startsWith("workspace:")) {
      const wsVersion = workspaceVersions.get(depName);
      if (!wsVersion) {
        console.error(`Cannot resolve workspace dep "${depName}" — no matching package.`);
        process.exit(1);
      }
      finalVersion = `^${wsVersion}`;
      if (scope) {
        // For scoped publishes, point the dep at the scoped variant via npm: alias.
        finalName = `@${scope.replace(/^@/, "")}/${depName}`;
      }
    }
    rewritten[finalName] = finalVersion;
  }
  pkg[depKey] = rewritten;
}

if (scope) {
  pkg.name = `@${scope.replace(/^@/, "")}/${pkg.name}`;
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Prepared ${pkgPath} for publish (scope=${scope ?? "none"})`);
