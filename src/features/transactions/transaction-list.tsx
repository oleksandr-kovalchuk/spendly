import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ViewTransition } from "react";

import { categoryLabel } from "@/shared/categories/category-label";
import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import type { DayGroup } from "./group-by-day";

type TransactionListProps = {
  groups: DayGroup[];
  // The page's other search params, kept in the edit links
  periodQuery?: Record<string, string>;
};

// Each item is a link to its edit form; the item's text is the link's name. Added and removed
// items and days fade in and out (the CSS is in globals.css), other updates don't animate. React
// animates a ViewTransition only with no DOM node between it and what's added or removed, so the
// days have their own, and the container stays when the list empties.
export function TransactionList({ groups, periodQuery }: TransactionListProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const tCategories = useTranslations("Categories");
  const format = useFormatter();

  return (
    <div className="grid gap-6">
      {groups.length === 0 ? <p className="text-muted-foreground">{t("list.empty")}</p> : null}
      {groups.map((group) => (
        <ViewTransition key={group.date} enter="item-enter" exit="item-exit" default="none">
          <div className="grid gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {/* A day has no time zone: it is shown on the UTC calendar it was written on */}
              <time dateTime={group.date}>
                {format.dateTime(new Date(`${group.date}T00:00:00Z`), {
                  timeZone: "UTC",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </time>
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {group.transactions.map((transaction) => {
                const sign = transaction.type === "income" ? 1 : -1;

                return (
                  <ViewTransition
                    key={transaction.id}
                    enter="item-enter"
                    exit="item-exit"
                    default="none"
                  >
                    <li>
                      <Link
                        href={{
                          pathname: `/${locale}/transactions`,
                          query: { ...periodQuery, edit: transaction.id },
                        }}
                        // The sheet opens over the list, which stays where it was
                        scroll={false}
                        // No hover background: muted text on the muted color fails AA contrast
                        className="group flex items-baseline justify-between gap-4 px-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <span className="grid min-w-0">
                          <span className="font-medium group-hover:underline">
                            {categoryLabel(transaction.category, tCategories)}
                          </span>
                          {transaction.note ? (
                            <span className="text-sm break-words text-muted-foreground">
                              {transaction.note}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {format.number(hryvniasOf(sign * transaction.amountKopecks), {
                            ...MONEY_FORMAT,
                            signDisplay: "always",
                          })}
                        </span>
                      </Link>
                    </li>
                  </ViewTransition>
                );
              })}
            </ul>
          </div>
        </ViewTransition>
      ))}
    </div>
  );
}
