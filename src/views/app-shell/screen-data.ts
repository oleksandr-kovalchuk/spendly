import "server-only";

import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { z } from "zod";

import { env } from "@/env";
import { parsePeriod } from "@/features/periods/period";
import { loadPeriodSearch } from "@/features/periods/period-search";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
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

export async function getEditingId(searchParams: ScreenSearchParams) {
  const { edit } = await searchParams;
  if (edit === undefined) return undefined;

  const parsed = z.uuid().safeParse(edit);
  if (!parsed.success) notFound();
  return parsed.data;
}

export const getCategoryOptions = cache(async () => {
  const [tCategories, categories] = await Promise.all([
    getTranslations("Categories"),
    listCategories(),
  ]);

  return categories.map((category) => ({
    id: category.id,
    type: category.type,
    defaultKey: category.defaultKey,
    icon: category.icon,
    label: categoryLabel(category, tCategories),
  }));
});
