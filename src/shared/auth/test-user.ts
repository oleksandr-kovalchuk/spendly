import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { user } from "@/shared/db/auth-schema";
import { db } from "@/shared/db/client";

import { auth } from "./auth";

const ORIGIN = "http://localhost:3000";
const PASSWORD = "correct horse battery";

function post(path: string, body: unknown) {
  const [a = 0, b = 0, c = 0] = randomUUID()
    .split("-")
    .map((part) => Number.parseInt(part.slice(0, 2), 16));

  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        // Each test user gets its own IP, so the sign-in rate limit never applies
        "x-real-ip": `10.${a}.${b}.${c}`,
      },
      body: JSON.stringify(body),
    }),
  );
}

// Signs up through the real auth handler, so sign-up hooks run, and signs in
export async function createUser() {
  const email = `${randomUUID()}@example.com`;
  await post("/sign-up/email", { email, password: PASSWORD, name: "" });
  const response = await post("/sign-in/email", { email, password: PASSWORD });
  const [created] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (!created) throw new Error("The test user was not created");

  return { id: created.id, email, cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
}
