import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

const LOCK_TIMEOUT_MS = 5_000;
const MIGRATIONS_FOLDER = "./drizzle";

// A standalone script: the app's env module needs the secrets it doesn't use
// oxlint-disable-next-line node/no-process-env
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const client = new Client({ connectionString });
await client.connect();

try {
  // A migration that waits for a lock fails the deploy instead of blocking queries
  await client.query(`SET lock_timeout = ${LOCK_TIMEOUT_MS}`);
  await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
} finally {
  await client.end();
}
