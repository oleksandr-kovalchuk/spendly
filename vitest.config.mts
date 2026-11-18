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
    // next-intl's middleware imports "next/server" without the extension Node's ESM loader needs
    server: { deps: { inline: ["next-intl"] } },
  },
});
