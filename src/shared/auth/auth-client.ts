import "client-only";

export type AuthFailure = { status: number; code?: string };
type AuthResult = { error: AuthFailure | null };

// Not a network response: the request itself failed (offline, blocked)
const NETWORK_ERROR_STATUS = 0;
const AUTH_BASE_PATH = "/api/auth";

function codeOf(body: unknown) {
  if (typeof body !== "object" || body === null || !("code" in body)) return undefined;

  return typeof body.code === "string" ? body.code : undefined;
}

// Always JSON: Better Auth answers 415 to a POST without it, even one with nothing to send
async function post(path: string, body: Record<string, string> = {}): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_BASE_PATH}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: { status: NETWORK_ERROR_STATUS } };
  }
  if (response.ok) return { error: null };

  const failure: unknown = await response.json().catch(() => undefined);
  return { error: { status: response.status, code: codeOf(failure) } };
}

// Better Auth's own HTTP routes, called with fetch: its rate limiter counts only these requests
// (decision 0003), and its browser client would add ~14 KB to every screen with a sign-out button
export const authClient = {
  signIn: {
    email: (credentials: { email: string; password: string }) =>
      post("/sign-in/email", credentials),
  },
  signUp: {
    email: (account: { email: string; password: string; name: string }) =>
      post("/sign-up/email", account),
  },
  signOut: () => post("/sign-out"),
};
