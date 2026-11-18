import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // As next/jest does, so tests can import the DAL and Server Actions
    alias: { "server-only": "next/dist/compiled/server-only/empty.js" },
  },
  // Testing Library cleans up between tests only with globals
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    // Vitest doesn't load .env; DATABASE_URL comes from the global setup
    env: {
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123456789",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
    // next-intl's middleware imports "next/server" without the extension Node's ESM loader needs
    server: { deps: { inline: ["next-intl"] } },
  },
});
