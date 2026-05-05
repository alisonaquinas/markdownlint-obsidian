#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const root = cwd();
const failures = [];

const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");

const bddFeatureDir = join(root, "extension/docs/bdd/features");
const featureFiles = readdirSync(bddFeatureDir).filter((file) => file.endsWith(".feature"));

if (featureFiles.length === 0) {
  failures.push("No BDD feature files found under extension/docs/bdd/features");
}

for (const file of featureFiles) {
  const body = read(`extension/docs/bdd/features/${file}`);
  if (!body.includes("Feature:")) {
    failures.push(`${file} is missing a Feature declaration`);
  }
  if (!body.includes("Scenario:")) {
    failures.push(`${file} is missing at least one Scenario`);
  }
  if (!body.includes("@MarkdownlintObsidian")) {
    failures.push(`${file} is missing functional requirement tags`);
  }
}

const traceability = read("extension/docs/bdd/traceability.md");
for (const file of featureFiles) {
  if (!traceability.includes(`features/${file}`)) {
    failures.push(`BDD traceability does not reference ${file}`);
  }
}

const dependencyDoc = read("extension/docs/architecture/flavor-grenade-dependency.md");
if (!dependencyDoc.includes("alisonaquinas.flavor-grenade-lsp")) {
  failures.push("Flavor Grenade dependency doc is missing the extension id");
}
if (!dependencyDoc.includes("ofmarkdown")) {
  failures.push("Flavor Grenade dependency doc is missing ofmarkdown");
}

const extensionPackagePath = join(root, "extension/package.json");
if (existsSync(extensionPackagePath)) {
  const packageJson = JSON.parse(readFileSync(extensionPackagePath, "utf8"));
  const dependencies = packageJson.extensionDependencies ?? [];
  const activationEvents = packageJson.activationEvents ?? [];

  if (!dependencies.includes("alisonaquinas.flavor-grenade-lsp")) {
    failures.push("extension/package.json is missing Flavor Grenade dependency");
  }

  if (!activationEvents.includes("onLanguage:ofmarkdown")) {
    failures.push("extension/package.json is missing onLanguage:ofmarkdown");
  }
} else {
  console.log("skip: extension/package.json is absent in this checkout.");
}

if (failures.length > 0) {
  console.error("Validation contract check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  exit(1);
}

console.log("Validation contract check passed.");
