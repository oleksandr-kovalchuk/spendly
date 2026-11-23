import type { Locale } from "next-intl";

export const LIST_SCREENS = ["overview", "transactions"] as const;
export type ListScreen = (typeof LIST_SCREENS)[number];

export function listUrlOf(locale: Locale, screen: ListScreen, query: Record<string, string>) {
  const path =
    screen === "transactions" ? (`/${locale}/transactions` as const) : (`/${locale}` as const);
  const search = new URLSearchParams(query);
  return search.size > 0 ? (`${path}?${search.toString()}` as const) : path;
}

export type ListUrl = ReturnType<typeof listUrlOf>;
