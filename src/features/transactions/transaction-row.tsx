import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { CategoryIcon } from "@/shared/categories/category-icon";
import { categoryLabel } from "@/shared/categories/category-label";
import { hryvniasOf, SIGNED_MONEY_FORMAT } from "@/shared/lib/money";

import { amountVariants } from "./amount-variants";
import { LazyDeleteTransactionButton } from "./lazy-delete-transaction-button";
import { listUrlOf, type ListScreen } from "./list-url";
import { SwipeableRow } from "./swipeable-row";
import type { TransactionDto } from "./transactions.dal";

type TransactionRowProps = {
  transaction: TransactionDto;
  screen: ListScreen;
  listQuery: Record<string, string>;
  detail: string | null;
};

export function TransactionRow({ transaction, screen, listQuery, detail }: TransactionRowProps) {
  const t = useTranslations("Transactions");
  const tCategories = useTranslations("Categories");
  const locale = useLocale();
  const format = useFormatter();
  const sign = transaction.type === "income" ? 1 : -1;
  const label = categoryLabel(transaction.category, tCategories);
  const editHref = listUrlOf(locale, screen, { ...listQuery, edit: transaction.id });

  return (
    <SwipeableRow
      editHref={editHref}
      editLabel={t("swipe.edit")}
      deleteLabel={t("delete.action")}
      deleteAction={
        <LazyDeleteTransactionButton
          transactionId={transaction.id}
          label={label}
          screen={screen}
          listQuery={listQuery}
          placement="row"
        />
      }
    >
      <Link
        href={editHref}
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
          <span className="font-medium transition-colors group-hover:text-primary">{label}</span>
          {detail ? (
            <span className="text-sm break-words text-muted-foreground">{detail}</span>
          ) : null}
        </span>
        <span className={amountVariants({ type: transaction.type })}>
          {format.number(hryvniasOf(sign * transaction.amountKopecks), SIGNED_MONEY_FORMAT)}
        </span>
      </Link>
    </SwipeableRow>
  );
}
