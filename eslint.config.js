import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "dist/",
      "node_modules/",
      "coverage/",
      "reports/",
      "action/dist/",
      "action/node_modules/",
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsparser },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      complexity: ["error", 7],
      "max-lines": ["warn", 200],
      "max-lines-per-function": ["warn", 30],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Test files: relax function-size rule; describe() blocks grow past 30 lines.
    files: ["tests/**/*.ts", "docs/bdd/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  {
    // Data-table files: these are pure data with no real complexity
    files: [
      "docs/bdd/steps/file-steps.ts",
      "src/infrastructure/rules/standard/registerStandard.ts",
      "src/cli/main.ts",
    ],
    rules: {
      "max-lines": "off",
    },
  },
];
