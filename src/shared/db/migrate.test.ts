import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

import { Client } from "pg";
import { expect, test } from "vitest";

import { env } from "@/env";

const execFileAsync = promisify(execFile);

async function withClient<T>(url: string, run: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

// Two runs of the migration script in a new Node process take about 5 s under the full suite
test(
  "migrations build the whole schema on an empty database, and run again without changes",
  {
    timeout: 20_000,
  },
  async () => {
    const name = `migrate_${randomUUID().replaceAll("-", "")}`;
    const emptyDatabaseUrl = new URL(env.DATABASE_URL);
    emptyDatabaseUrl.pathname = `/${name}`;
    await withClient(env.DATABASE_URL, (client) => client.query(`CREATE DATABASE ${name}`));

    try {
      const migrate = () =>
        execFileAsync(process.execPath, ["scripts/migrate.mts"], {
          env: { NODE_ENV: "test", DATABASE_URL: emptyDatabaseUrl.toString() },
        });
      await migrate();
      await migrate();

      const tables = await withClient(emptyDatabaseUrl.toString(), (client) =>
        client.query<{ table_name: string }>(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
        ),
      );
      expect(tables.rows.map((row) => row.table_name)).toEqual([
        "account",
        "categories",
        "email_outbox",
        "rate_limit",
        "session",
        "transactions",
        "user",
        "verification",
      ]);
    } finally {
      await withClient(env.DATABASE_URL, (client) => client.query(`DROP DATABASE ${name}`));
    }
  },
);
