import { ReceiptTextIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { CategoryIcon } from "@/shared/categories/category-icon";
import { categoryLabel } from "@/shared/categories/category-label";
import { hryvniasOf, SIGNED_MONEY_FORMAT } from "@/shared/lib/money";
import { NO_PERIOD_ANIMATION } from "@/shared/lib/period-transition";
import { Card, CardContent } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import { amountVariants } from "./amount-variants";
import { DeleteTransactionButton } from "./delete-transaction-button";
import type { DayGroup } from "./group-by-day";
import { SwipeableRow } from "./swipeable-row";

type TransactionListProps = {
  groups: DayGroup[];
  listQuery?: Record<string, string>;
  emptyAction: ReactNode;
};

export function TransactionList({ groups, listQuery, emptyAction }: TransactionListProps) {
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
                {group.transactions.map((transaction) => {
                  const sign = transaction.type === "income" ? 1 : -1;
                  const editQuery = { ...listQuery, edit: transaction.id };
                  const label = categoryLabel(transaction.category, tCategories);

                  return (
                    <ViewTransition
                      key={transaction.id}
                      enter={{ ...NO_PERIOD_ANIMATION, default: "item-enter" }}
                      exit={{ ...NO_PERIOD_ANIMATION, default: "item-exit" }}
                      default="none"
                    >
                      <li>
                        <SwipeableRow
                          editQuery={editQuery}
                          editLabel={t("swipe.edit")}
                          deleteLabel={t("delete.action")}
                          deleteAction={
                            <DeleteTransactionButton
                              transactionId={transaction.id}
                              label={label}
                              listQuery={listQuery ?? {}}
                              placement="row"
                            />
                          }
                        >
                          <Link
                            href={{ pathname: `/${locale}/transactions`, query: editQuery }}
                            scroll={false}
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
                                {label}
                              </span>
                              {transaction.note ? (
                                <span className="text-sm break-words text-muted-foreground">
                                  {transaction.note}
                                </span>
                              ) : null}
                            </span>
                            <span className={amountVariants({ type: transaction.type })}>
                              {format.number(
                                hryvniasOf(sign * transaction.amountKopecks),
                                SIGNED_MONEY_FORMAT,
                              )}
                            </span>
                          </Link>
                        </SwipeableRow>
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
