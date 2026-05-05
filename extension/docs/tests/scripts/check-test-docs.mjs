#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const root = cwd();
const requiredFiles = [
  "extension/docs/tests/README.md",
  "extension/docs/tests/unit-tests.md",
  "extension/docs/tests/verification-tests.md",
  "extension/docs/tests/validation-tests.md",
  "extension/docs/tests/automation.md",
  "extension/docs/tests/traceability.md",
  "extension/docs/tests/scripts/check-test-docs.mjs",
  "extension/docs/tests/scripts/run-verification-gates.mjs",
  "extension/docs/tests/scripts/check-validation-contracts.mjs",
];

const requiredReferences = [
  "unit-tests.md",
  "verification-tests.md",
  "validation-tests.md",
  "scripts/check-test-docs.mjs",
  "scripts/run-verification-gates.mjs",
  "scripts/check-validation-contracts.mjs",
];

const failures = [];

for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");

if (failures.length === 0) {
  const index = read("extension/docs/tests/README.md");
  for (const reference of requiredReferences) {
    if (!index.includes(reference)) {
      failures.push(`README.md does not reference ${reference}`);
    }
  }

  const automation = read("extension/docs/tests/automation.md");
  for (const reference of requiredReferences.slice(3)) {
    if (!automation.includes(reference)) {
      failures.push(`automation.md does not reference ${reference}`);
    }
  }

  for (const plan of ["unit-tests.md", "verification-tests.md", "validation-tests.md"]) {
    const body = read(`extension/docs/tests/${plan}`);
    if (!body.includes("## Current Automation")) {
      failures.push(`${plan} is missing a Current Automation section`);
    }
  }
}

if (failures.length > 0) {
  console.error("Extension test docs check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  exit(1);
}

console.log("Extension test docs check passed.");
