import "client-only";

export type AuthFailure = { status: number; code?: string };
type AuthResult = { error: AuthFailure | null };
type PostResult = { error: AuthFailure } | { error: null; status: number; body: unknown };
type SocialSignInResult = { error: AuthFailure } | { error: null; url: string };

// Not a network response: the request itself failed (offline, blocked)
const NETWORK_ERROR_STATUS = 0;
const AUTH_BASE_PATH = "/api/auth";

function codeOf(body: unknown) {
  if (typeof body !== "object" || body === null || !("code" in body)) return undefined;

  return typeof body.code === "string" ? body.code : undefined;
}

function urlOf(body: unknown) {
  if (typeof body !== "object" || body === null || !("url" in body)) return undefined;

  return typeof body.url === "string" ? body.url : undefined;
}

// Always JSON: Better Auth answers 415 to a POST without it, even one with nothing to send
async function postJson(path: string, body: Record<string, string>): Promise<PostResult> {
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
  const json: unknown = await response.json().catch(() => undefined);
  if (response.ok) return { error: null, status: response.status, body: json };

  return { error: { status: response.status, code: codeOf(json) } };
}

async function post(path: string, body: Record<string, string> = {}): Promise<AuthResult> {
  const { error } = await postJson(path, body);
  return { error };
}

async function signInSocial(params: {
  provider: "google";
  callbackURL: string;
  errorCallbackURL: string;
}): Promise<SocialSignInResult> {
  const result = await postJson("/sign-in/social", params);
  if (result.error) return result;

  const url = urlOf(result.body);
  return url ? { error: null, url } : { error: { status: result.status } };
}

// Better Auth's own HTTP routes, called with fetch: its rate limiter counts only these requests
// (decision 0003), and its browser client would add ~14 KB to every screen with a sign-out button
export const authClient = {
  signIn: {
    email: (credentials: { email: string; password: string }) =>
      post("/sign-in/email", credentials),
    social: signInSocial,
  },
  signUp: {
    email: (account: { email: string; password: string; name: string }) =>
      post("/sign-up/email", account),
  },
  signOut: () => post("/sign-out"),
  // Answers the same whether or not the email has an account
  requestPasswordReset: (request: { email: string; redirectTo: string }) =>
    post("/request-password-reset", request),
  resetPassword: (reset: { token: string; newPassword: string }) => post("/reset-password", reset),
  deleteUser: (confirmation: { password?: string }) => post("/delete-user", confirmation),
};
