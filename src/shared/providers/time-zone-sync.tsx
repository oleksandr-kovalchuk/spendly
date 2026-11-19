"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { TIME_ZONE_COOKIE } from "@/shared/lib/time-zone";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readTimeZoneCookie() {
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${TIME_ZONE_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(TIME_ZONE_COOKIE.length + 1)) : undefined;
}

// The server can't see the browser's time zone, so it reads it from this cookie to know "today"
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (readTimeZoneCookie() === timeZone) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    // The page that just rendered used UTC
    router.refresh();
  }, [router]);

  return null;
}
