import { Client } from "pg";

import { TODAY } from "./today";

async function query<Row extends Record<string, unknown>>(text: string, values: unknown[]) {
  // playwright.config.ts loads .env locally; CI sets it in the job
  // oxlint-disable-next-line node/no-process-env
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return (await client.query<Row>(text, values)).rows;
  } finally {
    await client.end();
  }
}

export async function resetTokenFor(email: string) {
  const [row] = await query<{ identifier: string }>(
    `SELECT v.identifier FROM verification v JOIN "user" u ON v.value = u.id
     WHERE u.email = $1 AND v.identifier LIKE 'reset-password:%'
     ORDER BY v.created_at DESC LIMIT 1`,
    [email],
  );
  if (!row) throw new Error(`No reset link for ${email}`);
  return row.identifier.slice("reset-password:".length);
}

export function resetEmailsFor(email: string) {
  return query<{ locale: string; status: string }>(
    `SELECT o.locale, o.status FROM email_outbox o JOIN "user" u ON o.user_id = u.id
     WHERE u.email = $1`,
    [email],
  );
}

export async function seedDataFor(email: string) {
  await query(
    `WITH u AS (SELECT id FROM "user" WHERE email = $1),
     food AS (
       UPDATE categories SET name = 'Groceries'
       WHERE user_id = (SELECT id FROM u) AND default_key = 'food'
       RETURNING id, user_id
     ),
     coffee AS (
       INSERT INTO categories (user_id, type, name, icon)
       SELECT id, 'expense', 'Coffee', 'coffee' FROM u
     )
     INSERT INTO transactions (user_id, category_id, amount_kopecks, occurred_on)
     SELECT user_id, id, 12345, $2::date FROM food`,
    [email, TODAY],
  );
}
