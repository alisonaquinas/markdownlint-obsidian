#!/usr/bin/env node
/**
 * Postbuild script: generates dist/bin.mjs and dist/package.json.
 *
 * Run automatically after `tsc -p tsconfig.build.json`.
 *
 * dist/bin.mjs
 *   Node-compatible published CLI entry point (#!/usr/bin/env node).
 *   Works for npm consumers, bunx consumers, and the Docker runtime stage.
 *
 * dist/package.json
 *   A minimal stub containing only { "version": "..." } so that the
 *   `createRequire`-based version lookup in dist/src/cli/args.js resolves
 *   correctly.  The compiled code does:
 *     const require = createRequire(import.meta.url);   // url = dist/src/cli/args.js
 *     const { version } = require("../../package.json"); // resolves to dist/package.json
 */

import { writeFileSync, chmodSync, readFileSync } from "node:fs";

// --- dist/bin.mjs ---
const BIN = "dist/bin.mjs";

const binContent = [
  "#!/usr/bin/env node",
  'import { main } from "./src/cli/main.js";',
  "const code = await main(process.argv);",
  "process.exit(code);",
  "",
].join("\n");

writeFileSync(BIN, binContent, { encoding: "utf8" });

try {
  chmodSync(BIN, 0o755);
} catch {
  // Windows — npm handles executable bits via the bin field.
}

console.log(`generated ${BIN}`);

// --- dist/package.json ---
const rootPkg = JSON.parse(readFileSync("package.json", "utf8"));
const distPkg = JSON.stringify({ version: rootPkg.version, type: "module" }, null, 2) + "\n";
writeFileSync("dist/package.json", distPkg, { encoding: "utf8" });
console.log(`generated dist/package.json (version: ${rootPkg.version})`);
