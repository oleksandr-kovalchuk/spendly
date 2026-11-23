import { ArrowRightIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";

import { DAY_TIME_ZONE, utcDateOf } from "@/shared/lib/utc-date";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardAction, CardHeader, CardTitle } from "@/shared/ui/card";

import { TransactionRow } from "./transaction-row";
import type { TransactionDto } from "./transactions.dal";

type LatestTransactionsProps = {
  transactions: TransactionDto[];
  periodQuery: Record<string, string>;
};

export function LatestTransactions({ transactions, periodQuery }: LatestTransactionsProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const format = useFormatter();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      {/* No CardContent: swiped rows reach the card's edges */}
      <Card className="pb-1">
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
        <ul className="divide-y divide-border">
          {transactions.map((transaction) => {
            const day = format.dateTime(utcDateOf(transaction.occurredOn), {
              timeZone: DAY_TIME_ZONE,
              day: "numeric",
              month: "long",
            });

            return (
              <li key={transaction.id}>
                <TransactionRow
                  transaction={transaction}
                  screen="overview"
                  listQuery={periodQuery}
                  detail={
                    transaction.note ? t("latest.noteAndDay", { note: transaction.note, day }) : day
                  }
                />
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
