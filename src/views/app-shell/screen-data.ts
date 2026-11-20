import "server-only";

import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { parsePeriod } from "@/features/periods/period";
import { loadPeriodSearch } from "@/features/periods/period-search";
import { getCurrentUser } from "@/shared/auth/session";
import { resolveTimeZone, TIME_ZONE_COOKIE, todayIn } from "@/shared/lib/time-zone";

// The data both period screens (Overview and Transactions) start from

export async function getCurrentUserOrSignIn() {
  const user = await getCurrentUser();
  if (!user) redirect(`/${await getLocale()}/sign-in`);

  return user;
}

export async function getToday() {
  const timeZone = resolveTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  // The current time is never prerendered or prefetched
  await connection();
  return todayIn(timeZone, new Date());
}

export type ScreenSearchParams = PageProps<"/[locale]">["searchParams"];

export async function getShownPeriod(searchParams: ScreenSearchParams) {
  const [today, search] = await Promise.all([
    getToday(),
    searchParams.then((params) => loadPeriodSearch(params)),
  ]);
  return { today, period: parsePeriod(search, today) };
}
