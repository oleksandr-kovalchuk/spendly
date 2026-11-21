import "server-only";

import { env } from "@/env";

// Canonical links name the production host, previews included, so search engines index one site
function siteUrl() {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  throw new Error("BETTER_AUTH_URL is not set");
}

export const SITE_URL = siteUrl();
