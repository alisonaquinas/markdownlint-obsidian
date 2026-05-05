#!/usr/bin/env node
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
