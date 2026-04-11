import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        // domain/ and application/ require 90%; infrastructure/ 80%
        // Vitest per-directory thresholds added in Phase 2 once layers are populated
        lines: 80,
        functions: 80,
        branches: 80,
      },
      include: ["src/**"],
    },
  },
});
