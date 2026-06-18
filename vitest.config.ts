import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the `@/*` -> `./src/*` alias from tsconfig.json natively, so tests
  // and source share one alias source of truth.
  resolve: { tsconfigPaths: true },
  test: {
    // All unit-test targets are pure or async logic (no DOM); node keeps it lean.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
