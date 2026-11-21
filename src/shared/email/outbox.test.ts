import { eq } from "drizzle-orm";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { emailOutbox } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const MESSAGE = {
  to: "someone@example.com",
  subject: "Reset your password",
  html: "<p>The link</p>",
  text: "The link",
};

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});

async function loadOutbox(apiKey: string) {
  vi.stubEnv("RESEND_API_KEY", apiKey);
  vi.resetModules();
  return import("./outbox");
}

async function send(apiKey: string) {
  const { sendOutboxEmail } = await loadOutbox(apiKey);
  const { id: userId } = await createUser();
  const id = await sendOutboxEmail({
    userId,
    kind: "password_reset",
    locale: "en",
    message: MESSAGE,
    maxPerHour: 1,
  });
  if (id === undefined) throw new Error("The email was not recorded");
  const [row] = await db
    .select({ status: emailOutbox.status, error: emailOutbox.error })
    .from(emailOutbox)
    .where(eq(emailOutbox.id, id));

  return { id, row };
}

test("sends the email through Resend and marks it sent", async () => {
  let request: Request | undefined;
  server.use(
    http.post(RESEND_EMAILS_URL, ({ request: received }) => {
      request = received.clone();
      return HttpResponse.json({ id: "resend-email-id" });
    }),
  );

  const { id, row } = await send("re_test_key");

  expect(row).toEqual({ status: "sent", error: null });
  expect(request?.headers.get("authorization")).toBe("Bearer re_test_key");
  // A repeated send of the same row can't deliver a second email
  expect(request?.headers.get("idempotency-key")).toBe(id);
  expect(await request?.json()).toMatchObject({
    from: "Spendly <onboarding@resend.dev>",
    ...MESSAGE,
  });
});

test("marks the email failed with Resend's error name", async () => {
  server.use(
    http.post(RESEND_EMAILS_URL, () =>
      HttpResponse.json(
        {
          statusCode: 403,
          name: "validation_error",
          message: "Testing emails go to your own address",
        },
        { status: 403 },
      ),
    ),
  );

  const { row } = await send("re_test_key");

  expect(row).toEqual({ status: "failed", error: "validation_error" });
});

test("marks the email failed when Resend can't be reached", async () => {
  server.use(http.post(RESEND_EMAILS_URL, () => HttpResponse.error()));

  const { row } = await send("re_test_key");

  expect(row).toEqual({ status: "failed", error: "application_error" });
});

test("without a key, keeps the email pending and sends nothing", async () => {
  // An unexpected request fails the test: the server has no handlers and errors on unhandled ones
  const { row } = await send("");

  expect(row).toEqual({ status: "pending", error: null });
});

test("parallel emails can't pass the hour's limit", async () => {
  const { sendOutboxEmail } = await loadOutbox("");
  const { id: userId } = await createUser();
  const send = () =>
    sendOutboxEmail({
      userId,
      kind: "password_reset",
      locale: "en",
      message: MESSAGE,
      maxPerHour: 3,
    });

  const ids = await Promise.all(Array.from({ length: 6 }, send));

  expect(ids.filter((id) => id !== undefined)).toHaveLength(3);
  expect(await db.$count(emailOutbox, eq(emailOutbox.userId, userId))).toBe(3);
});
