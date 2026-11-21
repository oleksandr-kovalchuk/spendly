import { ArrowRightIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { CategoryIcon } from "@/shared/categories/category-icon";
import { categoryLabel } from "@/shared/categories/category-label";
import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { amountVariants } from "./amount-variants";
import type { TransactionDto } from "./transactions.dal";

type LatestTransactionsProps = {
  transactions: TransactionDto[];
  // The shown period, kept in the link to all transactions
  periodQuery: Record<string, string>;
};

export function LatestTransactions({ transactions, periodQuery }: LatestTransactionsProps) {
  const t = useTranslations("Transactions");
  const tCategories = useTranslations("Categories");
  const locale = useLocale();
  const format = useFormatter();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={headingId}>{t("latest.heading")}</h2>
          </CardTitle>
          <CardAction>
            <Link
              href={{ pathname: `/${locale}/transactions`, query: periodQuery }}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("latest.all")}
              <ArrowRightIcon aria-hidden className="rtl:rotate-180" />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              // A day has no time zone: it is shown on the UTC calendar it was written on
              const day = format.dateTime(utcDateOf(transaction.occurredOn), {
                timeZone: DAY_TIME_ZONE,
                day: "numeric",
                month: "long",
              });

              return (
                <li key={transaction.id} className="flex items-center gap-3 py-3">
                  <CategoryIcon
                    category={{
                      id: transaction.categoryId,
                      defaultKey: transaction.category.defaultKey,
                      icon: transaction.category.icon,
                    }}
                  />
                  <span className="grid min-w-0 flex-1">
                    <span className="font-medium">
                      {categoryLabel(transaction.category, tCategories)}
                    </span>
                    <span className="text-sm wrap-break-word text-muted-foreground">
                      {transaction.note
                        ? t("latest.noteAndDay", { note: transaction.note, day })
                        : day}
                    </span>
                  </span>
                  <span className={amountVariants({ type: transaction.type })}>
                    {format.number(hryvniasOf((isIncome ? 1 : -1) * transaction.amountKopecks), {
                      ...MONEY_FORMAT,
                      signDisplay: "always",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
