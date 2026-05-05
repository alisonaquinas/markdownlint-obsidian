#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";
import { spawnSync } from "node:child_process";

const root = cwd();
const failures = [];

const run = (label, command, args, options = {}) => {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, {
    cwd: root,
    shell: process.platform === "win32",
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    failures.push(`${label} failed with exit code ${result.status}`);
  }
};

run("docs lint", "bun", ["run", "test:dogfood:docs"]);

run("extension docs lint", "bun", ["run", "test:dogfood:extension-docs"]);

const extensionPackagePath = join(root, "extension/package.json");
if (existsSync(extensionPackagePath)) {
  const packageJson = JSON.parse(readFileSync(extensionPackagePath, "utf8"));
  const scripts = packageJson.scripts ?? {};
  for (const scriptName of ["typecheck", "lint", "test", "build"]) {
    if (scripts[scriptName] !== undefined) {
      run(`extension ${scriptName}`, "bun", ["--cwd", "extension", "run", scriptName]);
    } else {
      failures.push(`extension/package.json is missing ${scriptName} script`);
    }
  }
} else {
  console.log("\n== extension package gates ==");
  console.log("planned skip: extension/package.json does not exist yet.");
}

if (failures.length > 0) {
  console.error("\nVerification gates failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  exit(1);
}

console.log("\nVerification gates passed.");
