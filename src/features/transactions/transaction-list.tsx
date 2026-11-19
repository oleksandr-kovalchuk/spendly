import { useFormatter, useTranslations } from "next-intl";

import { categoryLabel } from "@/shared/categories/category-label";

import type { DayGroup } from "./group-by-day";

const CURRENCY = "UAH";
const KOPECKS_PER_HRYVNIA = 100;

export function TransactionList({ groups }: { groups: DayGroup[] }) {
  const t = useTranslations("Transactions");
  const tCategories = useTranslations("Categories");
  const format = useFormatter();

  if (groups.length === 0) return <p className="text-muted-foreground">{t("list.empty")}</p>;

  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <div key={group.date} className="grid gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {/* A day has no time zone: it is shown on the UTC calendar it was written on */}
            <time dateTime={group.date}>
              {format.dateTime(new Date(`${group.date}T00:00:00Z`), {
                timeZone: "UTC",
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </time>
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {group.transactions.map((transaction) => {
              const sign = transaction.type === "income" ? 1 : -1;

              return (
                <li
                  key={transaction.id}
                  className="flex items-baseline justify-between gap-4 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {categoryLabel(transaction.category, tCategories)}
                    </p>
                    {transaction.note ? (
                      <p className="text-sm break-words text-muted-foreground">
                        {transaction.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {format.number((sign * transaction.amountKopecks) / KOPECKS_PER_HRYVNIA, {
                      style: "currency",
                      currency: CURRENCY,
                      currencyDisplay: "narrowSymbol",
                      signDisplay: "always",
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
