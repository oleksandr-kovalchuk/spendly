import { ReceiptTextIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ViewTransition, type ReactNode } from "react";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { hryvniasOf, SIGNED_MONEY_FORMAT } from "@/shared/lib/money";
import { NO_PERIOD_ANIMATION } from "@/shared/lib/period-transition";
import { Card, CardContent } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import type { DayGroup } from "./group-by-day";
import { TransactionRow } from "./transaction-row";

type TransactionListProps = {
  groups: DayGroup[];
  listQuery?: Record<string, string>;
  emptyAction: ReactNode;
};

export function TransactionList({ groups, listQuery = {}, emptyAction }: TransactionListProps) {
  const t = useTranslations("Transactions");
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
          <div className="grid scroll-rise grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              <time dateTime={group.date}>
                {format.dateTime(utcDateOf(group.date), {
                  timeZone: DAY_TIME_ZONE,
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </time>
            </h2>
            <p className="flex flex-wrap justify-end gap-x-3 text-sm font-medium text-muted-foreground tabular-nums">
              {group.incomeKopecks > 0 ? (
                <span className="text-income">
                  <span className="sr-only">{t("list.dayIncome")} </span>
                  {format.number(hryvniasOf(group.incomeKopecks), SIGNED_MONEY_FORMAT)}
                </span>
              ) : null}
              {group.expenseKopecks > 0 ? (
                <span>
                  <span className="sr-only">{t("list.dayExpenses")} </span>
                  {format.number(hryvniasOf(-group.expenseKopecks), SIGNED_MONEY_FORMAT)}
                </span>
              ) : null}
            </p>
            <Card className="col-span-2 py-1">
              <ul className="divide-y divide-border">
                {group.transactions.map((transaction) => (
                  <ViewTransition
                    key={transaction.id}
                    enter={{ ...NO_PERIOD_ANIMATION, default: "item-enter" }}
                    exit={{ ...NO_PERIOD_ANIMATION, default: "item-exit" }}
                    default="none"
                  >
                    <li>
                      <TransactionRow
                        transaction={transaction}
                        screen="transactions"
                        listQuery={listQuery}
                        detail={transaction.note}
                      />
                    </li>
                  </ViewTransition>
                ))}
              </ul>
            </Card>
          </div>
        </ViewTransition>
      ))}
    </div>
  );
}
