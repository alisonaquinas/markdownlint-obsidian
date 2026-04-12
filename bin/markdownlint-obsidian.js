#!/usr/bin/env -S node --import tsx
// Note: the -S flag in the shebang above is GNU coreutils / macOS 12.3+ only.
// On older macOS or Alpine containers, use the Docker image or `npx` invocation instead.
// The dist/bin.mjs built by `npm run build` does not use this shebang.
import { main } from "../src/cli/main.ts";
const code = await main(process.argv);
process.exit(code);
