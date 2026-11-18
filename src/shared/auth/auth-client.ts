import "client-only";

import { createAuthClient } from "better-auth/client";

// Same origin as the app, so no base URL; its rate limiter counts HTTP requests only,
// which is why sign-up and sign-in go through the browser client and not Server Actions
export const authClient = createAuthClient();
