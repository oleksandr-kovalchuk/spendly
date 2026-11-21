import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";

import { env } from "@/env";
import { parsePeriod } from "@/features/periods/period";
import { loadPeriodSearch } from "@/features/periods/period-search";
import { resolveTimeZone, TIME_ZONE_COOKIE, todayIn } from "@/shared/lib/time-zone";

export async function getToday() {
  const timeZone = resolveTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  // The current time is never prerendered or prefetched
  await connection();
  // E2E runs fix the day, so their dates don't depend on when they run (decision 0010)
  return env.E2E_TODAY ?? todayIn(timeZone, new Date());
}

export type ScreenSearchParams = PageProps<"/[locale]">["searchParams"];

export async function getShownPeriod(searchParams: ScreenSearchParams) {
  const [today, search] = await Promise.all([
    getToday(),
    searchParams.then((params) => loadPeriodSearch(params)),
  ]);
  return { today, period: parsePeriod(search, today) };
}
