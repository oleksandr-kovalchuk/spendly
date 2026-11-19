import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { categoryLabel } from "@/shared/categories/category-label";

import { buttonVariants } from "@/shared/ui/button";

import { DeleteTransactionButton } from "./delete-transaction-button";
import type { DayGroup } from "./group-by-day";

const CURRENCY = "UAH";
const KOPECKS_PER_HRYVNIA = 100;

// The transaction open in the form has no actions: deleting it would leave the form without one
export function TransactionList({ groups, editingId }: { groups: DayGroup[]; editingId?: string }) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
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

              const label = categoryLabel(transaction.category, tCategories);
              const isEditing = transaction.id === editingId;

              return (
                <li
                  key={transaction.id}
                  aria-current={isEditing ? "true" : undefined}
                  className="grid gap-1 px-3 py-2 aria-[current=true]:bg-muted"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{label}</p>
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
                  </div>
                  {isEditing ? (
                    <p className="text-sm text-muted-foreground">{t("list.editing")}</p>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Link
                        href={{ pathname: `/${locale}`, query: { edit: transaction.id } }}
                        aria-label={t("list.edit", { category: label })}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        {t("list.editAction")}
                      </Link>
                      <DeleteTransactionButton transactionId={transaction.id} label={label} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
