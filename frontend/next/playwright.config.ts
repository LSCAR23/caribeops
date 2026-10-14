import { defineConfig } from "@playwright/test";

// End-to-end setup (D6-26): real chromium against the dev stack.
// The stack is assumed up (artisan serve :8000 + next dev :3101 over
// seeded PG) — explicit like the D6-12…15 manual runs, no hidden
// webServers. Credentials come from the environment, never the repo.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3101",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
