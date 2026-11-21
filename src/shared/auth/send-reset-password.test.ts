import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";

import { createUser } from "./test-user";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RESET_LINK = "http://localhost:3000/api/auth/reset-password/token123?callbackURL=";

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

async function sendWithResend(callbackURL: string) {
  const sent: unknown[] = [];
  server.use(
    http.post(RESEND_EMAILS_URL, async ({ request }) => {
      sent.push(await request.json());
      return HttpResponse.json({ id: "resend-email-id" });
    }),
  );
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.resetModules();
  const { sendResetPasswordEmail } = await import("./send-reset-password");
  const user = await createUser();
  const url = `${RESET_LINK}${encodeURIComponent(callbackURL)}`;

  await sendResetPasswordEmail({ user, url });

  return { sent, user, url };
}

test("emails the link to the user in the language of the page it was requested from", async () => {
  const { sent, user, url } = await sendWithResend("/uk/reset-password");

  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ to: user.email, subject: "Скидання пароля в Spendly" });
  expect(sent[0]).toHaveProperty("text", expect.stringContaining(url));
});

test("falls back to English when the page has no known language", async () => {
  const { sent } = await sendWithResend("/de/reset-password");

  expect(sent[0]).toMatchObject({ subject: "Reset your Spendly password" });
});
