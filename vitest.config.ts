import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "path";

// Load test env before anything else
config({ path: ".env.test", override: true });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", ".symphony", "~/code"],
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
