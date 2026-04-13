#!/usr/bin/env node
/**
 * Postbuild script: generates dist/package.json for the core package.
 *
 * Run automatically after `tsc -p tsconfig.build.json`.
 *
 * dist/package.json
 *   A minimal stub containing `{ "version": "...", "type": "module" }` so
 *   that `createRequire`-based version lookups in compiled output under
 *   dist/src/ resolve correctly. For example, SarifFormatter.js at
 *   dist/src/infrastructure/formatters/ does `require("../../../package.json")`
 *   which resolves to dist/package.json.
 */

import { writeFileSync, readFileSync } from "node:fs";

const rootPkg = JSON.parse(readFileSync("package.json", "utf8"));
const distPkg = JSON.stringify({ version: rootPkg.version, type: "module" }, null, 2) + "\n";
writeFileSync("dist/package.json", distPkg, { encoding: "utf8" });
console.log(`generated dist/package.json (version: ${rootPkg.version})`);
