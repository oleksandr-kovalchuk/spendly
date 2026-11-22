import "server-only";

import { Resend } from "resend";

import { env } from "@/env";

const SEND_TIMEOUT_MS = 10_000;

export type EmailMessage = { to: string; subject: string; html: string; text: string };
type SendResult = { status: "sent" } | { status: "failed"; error: string } | { status: "skipped" };

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : undefined;

// The SDK returns errors instead of throwing, a timeout included
export async function sendEmail(
  message: EmailMessage,
  idempotencyKey: string,
): Promise<SendResult> {
  if (!resend) return { status: "skipped" };

  const { error } = await resend.emails.send(
    { from: env.EMAIL_FROM, ...message },
    { idempotencyKey, signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
  );

  return error ? { status: "failed", error: error.name } : { status: "sent" };
}
