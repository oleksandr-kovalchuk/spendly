import { ReceiptTextIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { CategoryIcon } from "@/shared/categories/category-icon";
import { categoryLabel } from "@/shared/categories/category-label";
import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";
import { NO_PERIOD_ANIMATION } from "@/shared/lib/period-transition";
import { Card, CardContent } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import { amountVariants } from "./amount-variants";
import type { DayGroup } from "./group-by-day";

type TransactionListProps = {
  groups: DayGroup[];
  periodQuery?: Record<string, string>;
  emptyAction: ReactNode;
};

// React animates a ViewTransition only with no DOM node between it and what's added or removed,
// so each day has its own, and the container stays when the list empties
export function TransactionList({ groups, periodQuery, emptyAction }: TransactionListProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const tCategories = useTranslations("Categories");
  const format = useFormatter();

  return (
    <div className="grid gap-6">
      {groups.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptTextIcon aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{t("list.empty")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>{emptyAction}</EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : null}
      {groups.map((group) => (
        <ViewTransition
          key={group.date}
          enter={{ ...NO_PERIOD_ANIMATION, default: "item-enter" }}
          exit={{ ...NO_PERIOD_ANIMATION, default: "item-exit" }}
          default="none"
        >
          <div className="grid scroll-rise gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {/* A day has no time zone: it is shown on the UTC calendar it was written on */}
              <time dateTime={group.date}>
                {format.dateTime(utcDateOf(group.date), {
                  timeZone: DAY_TIME_ZONE,
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </time>
            </h2>
            <Card className="py-1">
              <ul className="divide-y divide-border">
                {group.transactions.map((transaction) => {
                  const sign = transaction.type === "income" ? 1 : -1;

                  return (
                    <ViewTransition
                      key={transaction.id}
                      enter={{ ...NO_PERIOD_ANIMATION, default: "item-enter" }}
                      exit={{ ...NO_PERIOD_ANIMATION, default: "item-exit" }}
                      default="none"
                    >
                      <li>
                        <Link
                          href={{
                            pathname: `/${locale}/transactions`,
                            query: { ...periodQuery, edit: transaction.id },
                          }}
                          scroll={false}
                          // No hover background: muted text on bg-muted fails AA contrast
                          className="group flex items-center gap-3 px-5 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
                        >
                          <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
                            <CategoryIcon
                              category={{
                                id: transaction.categoryId,
                                defaultKey: transaction.category.defaultKey,
                                icon: transaction.category.icon,
                              }}
                            />
                          </span>
                          <span className="grid min-w-0 flex-1">
                            <span className="font-medium transition-colors group-hover:text-primary">
                              {categoryLabel(transaction.category, tCategories)}
                            </span>
                            {transaction.note ? (
                              <span className="text-sm break-words text-muted-foreground">
                                {transaction.note}
                              </span>
                            ) : null}
                          </span>
                          <span className={amountVariants({ type: transaction.type })}>
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
            </Card>
          </div>
        </ViewTransition>
      ))}
    </div>
  );
}
