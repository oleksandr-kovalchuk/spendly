import { deleteOldOutboxEmails } from "@/shared/email/outbox";
import { isCronRequest } from "@/shared/lib/cron-request";

// Vercel Cron calls it daily (vercel.json)
export async function GET(request: Request) {
  if (!isCronRequest(request)) return new Response(null, { status: 401 });

  await deleteOldOutboxEmails();
  return new Response(null, { status: 204 });
}
