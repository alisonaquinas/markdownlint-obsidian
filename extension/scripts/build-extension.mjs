/**
 * Bundle the VS Code extension runtime into the CommonJS entry point declared
 * by `extension/package.json`.
 *
 * VS Code provides the `vscode` module at runtime, so it must stay external.
 * The bundled markdownlint-obsidian library is included through normal package
 * imports to avoid any CLI dependency in editor execution.
 */

import { build } from "esbuild";

await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  mainFields: ["module", "main"],
  outfile: "dist/extension.cjs",
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info",
});
