import { inArray } from "drizzle-orm";
import { afterAll, expect, test, vi } from "vitest";

import { env } from "@/env";
import { createUser } from "@/shared/auth/test-user";
import { emailOutbox } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { GET } from "./route";

const DAY_MS = 24 * 60 * 60 * 1000;
const CRON_URL = "http://localhost:3000/api/cron/email-outbox";

afterAll(() => {
  vi.unstubAllEnvs();
});

function cronRequest(authorization?: string) {
  return new Request(CRON_URL, { headers: authorization ? { authorization } : {} });
}

async function addEmails(ages: number[]) {
  const { id: userId } = await createUser();
  const rows = await db
    .insert(emailOutbox)
    .values(
      ages.map((ageMs) => ({
        userId,
        kind: "password_reset" as const,
        locale: "en",
        createdAt: new Date(Date.now() - ageMs),
      })),
    )
    .returning({ id: emailOutbox.id });

  return rows.map((row) => row.id);
}

async function remaining(ids: string[]) {
  const rows = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(inArray(emailOutbox.id, ids));
  return rows.map((row) => row.id);
}

test("deletes emails older than a day and keeps newer ones", async () => {
  const [old = "", recent = ""] = await addEmails([DAY_MS + 60_000, DAY_MS - 60_000]);

  const response = await GET(cronRequest(`Bearer ${env.CRON_SECRET}`));

  expect(response.status).toBe(204);
  expect(await remaining([old, recent])).toEqual([recent]);
});

test.each([
  ["no authorization", undefined],
  ["a wrong secret", "Bearer wrong-secret-0123456789"],
  ["the secret without the scheme", env.CRON_SECRET],
])("refuses a request with %s and deletes nothing", async (_, authorization) => {
  const [old = ""] = await addEmails([DAY_MS + 60_000]);

  const response = await GET(cronRequest(authorization));

  expect(response.status).toBe(401);
  expect(await remaining([old])).toEqual([old]);
});

test("without CRON_SECRET, refuses every request", async () => {
  vi.stubEnv("CRON_SECRET", "");
  vi.resetModules();
  const { GET: getWithoutSecret } = await import("./route");

  const response = await getWithoutSecret(cronRequest("Bearer undefined"));

  expect(response.status).toBe(401);
});
