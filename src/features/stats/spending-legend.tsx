import { cva } from "class-variance-authority";
import { cn } from "cn";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { categorySwatchVariants } from "@/shared/categories/category-look";
import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import type { SpendingItem } from "./spending-item";

type SpendingLegendProps = {
  items: SpendingItem[];
  labelledBy: string;
  activeId?: string | null;
  onActiveChange?: (id: string | null) => void;
};

const swatchVariants = cva("size-2.5 shrink-0 rounded-full transition-transform duration-200", {
  variants: { isActive: { true: "scale-150", false: "" } },
});

const rowVariants = cva("relative", {
  variants: { isActive: { true: "text-primary", false: "" } },
});

const shareVariants = cva("w-16 py-1 ps-3 text-end whitespace-nowrap transition-colors", {
  variants: { isActive: { true: "text-primary", false: "text-muted-foreground" } },
});

export function SpendingLegend({
  items,
  labelledBy,
  activeId = null,
  onActiveChange,
}: SpendingLegendProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const locale = useLocale();
  const total = items.reduce((sum, item) => sum + item.amountKopecks, 0);

  return (
    <table aria-labelledby={labelledBy} className="w-full self-start tabular-nums">
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("legend.category")}</th>
          <th scope="col">{t("legend.amount")}</th>
          <th scope="col">{t("legend.share")}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className={rowVariants({ isActive: item.id === activeId })}
            onPointerEnter={() => onActiveChange?.(item.id)}
            onPointerLeave={() => onActiveChange?.(null)}
          >
            <th scope="row" className="py-1.5 text-start font-normal break-words">
              <Link
                href={{ pathname: `/${locale}/transactions`, query: item.transactionsQuery }}
                className="flex items-center gap-2.5 transition-colors outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    swatchVariants({ isActive: item.id === activeId }),
                    categorySwatchVariants({ color: item.color }),
                  )}
                />
                {item.label}
              </Link>
            </th>
            <td className="py-1 ps-4 text-end font-medium whitespace-nowrap transition-colors">
              {format.number(hryvniasOf(item.amountKopecks), MONEY_FORMAT)}
            </td>
            <td className={shareVariants({ isActive: item.id === activeId })}>
              {format.number(item.amountKopecks / total, {
                style: "percent",
                maximumFractionDigits: 1,
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
