import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";

import { proxy } from "./proxy";

function redirectTarget(path: string, acceptLanguage?: string, cookie?: string) {
  const request = new NextRequest(new URL(path, "http://localhost"), {
    headers: {
      ...(acceptLanguage ? { "accept-language": acceptLanguage } : {}),
      ...(cookie ? { cookie } : {}),
    },
  });
  const response = proxy(request);
  const location = response.headers.get("location");

  return location ? new URL(location).pathname : null;
}

describe("locale detection on /", () => {
  test.each([
    ["uk-UA,uk;q=0.9,en;q=0.8", "/uk"],
    ["uk", "/uk"],
    ["en-US,en;q=0.9,uk;q=0.8", "/en"],
    ["fr-FR,fr;q=0.9,uk;q=0.5", "/uk"],
    ["fr-FR,fr;q=0.9", "/en"],
    ["de", "/en"],
  ])("%s lands on %s", (acceptLanguage, expected) => {
    expect(redirectTarget("/", acceptLanguage)).toBe(expected);
  });

  test("no Accept-Language lands on English", () => {
    expect(redirectTarget("/")).toBe("/en");
  });
});

describe("paths", () => {
  test("a path without a language gets one", () => {
    expect(redirectTarget("/no-such-page", "uk")).toBe("/uk/no-such-page");
  });

  test.each(["/en/sign-in", "/uk/sign-up", "/uk/no-such-page"])("%s is left alone", (path) => {
    expect(redirectTarget(path, "uk")).toBeNull();
  });
});

describe("private pages", () => {
  test.each([
    ["/en", "/en/sign-in"],
    ["/uk", "/uk/sign-in"],
    ["/uk/", "/uk/sign-in"],
    ["/en/transactions", "/en/sign-in"],
    ["/uk/transactions?period=week", "/uk/sign-in"],
    ["/en/categories", "/en/sign-in"],
    ["/uk/categories/", "/uk/sign-in"],
    ["/en/settings", "/en/sign-in"],
  ])("%s without a session cookie goes to %s", (path, expected) => {
    expect(redirectTarget(path)).toBe(expected);
  });

  test.each(["better-auth.session_token=abc", "__Secure-better-auth.session_token=abc"])(
    "opens with the cookie %s",
    (cookie) => {
      expect(redirectTarget("/uk", undefined, cookie)).toBeNull();
      expect(redirectTarget("/uk/categories", undefined, cookie)).toBeNull();
    },
  );

  test("sign-in is not bounced away by a cookie, since the cookie may be expired", () => {
    expect(redirectTarget("/en/sign-in", undefined, "better-auth.session_token=abc")).toBeNull();
  });
});
