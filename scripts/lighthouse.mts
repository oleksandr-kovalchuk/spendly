// Checks each route's JS against the budget in lighthouserc.json, on the production build:
// run `pnpm build` and `pnpm db:migrate` first, and install Playwright's Chromium.
// Knip can't see `lhci`, which runs through `pnpm exec`: knip.json ignores @lhci/cli.
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium, type BrowserContext } from "@playwright/test";
import { z } from "zod";

// The same port as Playwright's server, which BETTER_AUTH_URL names in CI
// oxlint-disable-next-line node/no-process-env
const PORT = Number(process.env.PORT ?? 3210);
const BASE_URL = `http://localhost:${PORT}`;
const PUBLIC_PATHS = ["/en/sign-in", "/en/sign-up"];
const SIGNED_IN_PATHS = ["/en", "/en/transactions", "/en/categories"];
const PASSWORD = "correct horse battery";
const SERVER_START_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;
// Where `lhci collect` saves its reports
const REPORTS_DIR = ".lighthouseci";

function run(command: string, args: string[]) {
  const child = spawn(command, args, { stdio: "inherit" });
  return once(child, "exit").then(([code]) => {
    if (code !== 0) throw new Error(`${command} ${args.join(" ")} exited with ${String(code)}`);
  });
}

async function waitForServer() {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`The server exited with ${server.exitCode}`);
    const isUp = await fetch(`${BASE_URL}/en/sign-in`).then(
      (response) => response.ok,
      () => false,
    );
    if (isUp) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`The server didn't start on ${BASE_URL}`);
}

// Through the browser's own cookie store: a Cookie header from Lighthouse reaches only the page
// itself, not the router's requests after it, which the proxy then redirects to sign-in
async function signInNewUser(context: BrowserContext) {
  const email = `lighthouse-${randomUUID()}@example.com`;
  // Better Auth rejects a request with cookies from another origin
  const headers = { Origin: BASE_URL };
  const signUp = await context.request.post(`${BASE_URL}/api/auth/sign-up/email`, {
    headers,
    data: { email, password: PASSWORD, name: "" },
  });
  if (!signUp.ok()) throw new Error(`Sign-up failed with ${signUp.status()}`);

  const signIn = await context.request.post(`${BASE_URL}/api/auth/sign-in/email`, {
    headers,
    data: { email, password: PASSWORD },
  });
  if (!signIn.ok()) throw new Error(`Sign-in failed with ${signIn.status()}`);
}

// Lighthouse opens its pages in this browser, so they share its cookies
function collect(paths: string[], debuggingPort: string, isAdditive: boolean) {
  const urls = paths.map((path) => `--url=${BASE_URL}${path}`);
  const additive = isAdditive ? ["--additive"] : [];
  return run("pnpm", [
    "exec",
    "lhci",
    "collect",
    ...urls,
    ...additive,
    `--settings.port=${debuggingPort}`,
  ]);
}

// A signed-in screen without a valid session redirects to sign-in, which would be measured instead
async function checkNoRedirects() {
  const reports = (await readdir(REPORTS_DIR)).filter((name) => /^lhr-.*\.json$/.test(name));
  for (const name of reports) {
    const report: unknown = JSON.parse(await readFile(join(REPORTS_DIR, name), "utf8"));
    const { requestedUrl, finalDisplayedUrl } = z
      .object({ requestedUrl: z.string(), finalDisplayedUrl: z.string() })
      .parse(report);
    if (requestedUrl !== finalDisplayedUrl) {
      throw new Error(`${requestedUrl} ended on ${finalDisplayedUrl}`);
    }
  }
}

// Its own process group, so stopping it stops `next` too, not only `pnpm`
const server: ChildProcess = spawn("pnpm", ["start", "--port", String(PORT)], {
  stdio: "inherit",
  detached: true,
});
const profileDir = await mkdtemp(join(tmpdir(), "lighthouse-profile-"));

try {
  await waitForServer();
  // A persistent context is the browser's default one, the context Lighthouse's pages open in
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chromium",
    args: ["--remote-debugging-port=0"],
  });
  try {
    // Chrome writes the port it picked here
    const [debuggingPort = ""] = (await readFile(join(profileDir, "DevToolsActivePort"), "utf8"))
      .split("\n")
      .filter(Boolean);

    await collect(PUBLIC_PATHS, debuggingPort, false);
    await signInNewUser(context);
    await collect(SIGNED_IN_PATHS, debuggingPort, true);
  } finally {
    await context.close();
  }
  await checkNoRedirects();
  await run("pnpm", ["exec", "lhci", "assert"]);
} finally {
  if (server.pid !== undefined && server.exitCode === null) process.kill(-server.pid);
  await rm(profileDir, { recursive: true, force: true });
}
