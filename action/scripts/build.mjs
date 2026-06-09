#!/usr/bin/env node
/**
 * Purpose: Build the committed GitHub Action bundle.
 *
 * Provides: an esbuild invocation that writes `dist/main.mjs`.
 *
 * Role in system: Keeps the action's checked-in runtime artifact in sync with
 * `src/main.ts` while preserving ESM semantics required by the GitHub Actions
 * Node runtime.
 *
 * Constraints: Build warnings are treated as failures because GitHub Actions
 * executes the committed bundle directly.
 */
import { build } from "esbuild";

const result = await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/main.mjs",
  mainFields: ["module", "main"],
  banner: {
    // Some bundled @actions dependencies still expect CommonJS `require`.
    // The shim is local to the bundle and keeps the entry file ESM-compatible.
    js: "import { createRequire } from 'node:module';const require = createRequire(import.meta.url);",
  },
  logLevel: "silent",
});

if (result.warnings.length > 0) {
  for (const warning of result.warnings) {
    console.error(warning.text);
  }
  process.exit(1);
}
