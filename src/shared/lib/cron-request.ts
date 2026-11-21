import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "@/env";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; the digests have equal lengths,
// which timingSafeEqual requires
export function isCronRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!env.CRON_SECRET || !authorization) return false;

  return timingSafeEqual(digest(authorization), digest(`Bearer ${env.CRON_SECRET}`));
}
