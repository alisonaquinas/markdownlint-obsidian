#!/usr/bin/env -S node --import tsx
import { main } from "../src/cli/main.ts";
const code = await main(process.argv);
process.exit(code);
