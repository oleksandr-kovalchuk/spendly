import { XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import type { CategoryIconKey, DefaultCategoryKey } from "@/shared/db/app-constants";
import { CategoryIcon } from "@/shared/categories/category-icon";

type CategoryFilterProps = {
  category: {
    id: string;
    defaultKey: DefaultCategoryKey | null;
    icon: CategoryIconKey | null;
    label: string;
  };
  clearQuery: Record<string, string>;
};

export function CategoryFilter({ category, clearQuery }: CategoryFilterProps) {
  const t = useTranslations("Transactions.filter");
  const locale = useLocale();

  return (
    <Link
      href={{ pathname: `/${locale}/transactions`, query: clearQuery }}
      scroll={false}
      aria-label={t("clear", { category: category.label })}
      className="inline-flex min-h-9 items-center gap-2 justify-self-start rounded-full bg-secondary ps-1 pe-3 text-sm font-medium text-secondary-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
    >
      <CategoryIcon category={category} size="sm" />
      {category.label}
      <XIcon aria-hidden className="size-4" />
    </Link>
  );
}
