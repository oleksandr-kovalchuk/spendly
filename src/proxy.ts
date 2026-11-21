import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);
// Paths after the locale; "" is the main page
const PRIVATE_PATHS = new Set(["", "transactions", "categories", "settings"]);

// Optimistic only: it checks that a session cookie exists, and the pages check the session itself
export function proxy(request: NextRequest) {
  const [locale, ...path] = request.nextUrl.pathname.split("/").filter(Boolean);
  const isPrivate = PRIVATE_PATHS.has(path.join("/"));

  if (hasLocale(routing.locales, locale) && isPrivate && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
