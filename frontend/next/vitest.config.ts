import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Component-test setup (D6-25): jsdom + jest-dom matchers. The `@`
// alias mirrors tsconfig paths without an extra plugin.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.tsx"],
    // Playwright owns e2e/*.spec.ts (D6-26) — never run browser specs here.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
