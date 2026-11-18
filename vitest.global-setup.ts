import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PostgreSqlContainer } from "@testcontainers/postgresql";

const POSTGRES_IMAGE = "postgres:18-alpine";
const execFileAsync = promisify(execFile);

// TEST_DATABASE_URL points at an existing Postgres for machines without Docker
export async function setup() {
  const container = process.env.TEST_DATABASE_URL
    ? undefined
    : await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const url = process.env.TEST_DATABASE_URL ?? container?.getConnectionUri();
  if (!url) throw new Error("The test database has no URL");

  process.env.DATABASE_URL = url;
  await execFileAsync("node", ["scripts/migrate.mts"], { env: process.env });

  return async () => {
    await container?.stop();
  };
}
