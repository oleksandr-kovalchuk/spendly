import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";

import { proxy } from "./proxy";

function redirectTarget(path: string, acceptLanguage?: string) {
  const request = new NextRequest(new URL(path, "http://localhost"), {
    headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
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

  test.each(["/en", "/uk", "/uk/no-such-page"])("%s is left alone", (path) => {
    expect(redirectTarget(path, "uk")).toBeNull();
  });
});
