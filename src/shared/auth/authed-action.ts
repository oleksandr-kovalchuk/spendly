import "server-only";

import { createSafeActionClient, returnServerError } from "next-safe-action";

import { getCurrentUser } from "./session";

export const UNAUTHORIZED_ERROR = "unauthorized";

export const authedAction = createSafeActionClient().use(async ({ next }) => {
  const user = await getCurrentUser();
  if (!user) returnServerError(UNAUTHORIZED_ERROR);

  return next({ ctx: { user } });
});
