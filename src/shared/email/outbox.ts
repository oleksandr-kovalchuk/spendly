import "server-only";

import { and, eq, gt, lt, sql } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { emailOutbox } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { sendEmail, type EmailMessage } from "./resend";

type OutboxEmail = {
  userId: string;
  kind: (typeof emailOutbox.$inferInsert)["kind"];
  locale: Locale;
  message: EmailMessage;
  maxPerHour: number;
};

// The count and the insert share a lock, so parallel requests can't pass the limit together
async function recordEmail({ userId, kind, locale, maxPerHour }: Omit<OutboxEmail, "message">) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`email-outbox:${kind}:${userId}`}))`,
    );
    const sentInLastHour = await tx.$count(
      emailOutbox,
      and(
        eq(emailOutbox.userId, userId),
        eq(emailOutbox.kind, kind),
        gt(emailOutbox.createdAt, sql`now() - interval '1 hour'`),
      ),
    );
    if (sentInLastHour >= maxPerHour) return undefined;

    const [row] = await tx
      .insert(emailOutbox)
      .values({ userId, kind, locale })
      .returning({ id: emailOutbox.id });
    if (!row) throw new Error("The outbox row was not created");
    return row.id;
  });
}

// Records the email, then sends it, unless the user got `maxPerHour` of its kind in the last
// hour; the row keeps only IDs and the delivery status
export async function sendOutboxEmail({ message, ...email }: OutboxEmail) {
  const id = await recordEmail(email);
  if (id === undefined) return undefined;

  const result = await sendEmail(message, id);
  if (result.status !== "skipped") {
    await db
      .update(emailOutbox)
      .set(
        result.status === "sent" ? { status: "sent" } : { status: "failed", error: result.error },
      )
      .where(eq(emailOutbox.id, id));
  }

  return id;
}

// Rows only serve the per-user limit and delivery checks, which look back an hour at most
export async function deleteOldOutboxEmails() {
  await db.delete(emailOutbox).where(lt(emailOutbox.createdAt, sql`now() - interval '1 day'`));
}
