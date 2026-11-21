import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

import { TODAY } from "./e2e/today";

// The tests read reset links from the server's database; CI sets DATABASE_URL in the job
if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.PORT ?? 3210);

// Runs against the production build: run `pnpm build` first
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !process.env.CI,
    // Emails stay pending in the outbox instead of going to Resend; .env doesn't override them.
    // The app treats TODAY as today, so the tests' dates don't depend on the day they run
    env: { RESEND_API_KEY: "", E2E_TODAY: TODAY },
  },
});
