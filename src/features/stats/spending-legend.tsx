import { cva } from "class-variance-authority";
import { cn } from "cn";
import { useFormatter, useTranslations } from "next-intl";

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

// A table, so screen readers get the chart's data with its column names
export function SpendingLegend({
  items,
  labelledBy,
  activeId = null,
  onActiveChange,
}: SpendingLegendProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
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
            onPointerEnter={() => onActiveChange?.(item.id)}
            onPointerLeave={() => onActiveChange?.(null)}
          >
            <th scope="row" className="py-1.5 text-start font-normal break-words">
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    swatchVariants({ isActive: item.id === activeId }),
                    categorySwatchVariants({ color: item.color }),
                  )}
                />
                {item.label}
              </span>
            </th>
            <td className="py-1 ps-4 text-end font-medium whitespace-nowrap">
              {format.number(hryvniasOf(item.amountKopecks), MONEY_FORMAT)}
            </td>
            <td className="w-16 py-1 ps-3 text-end whitespace-nowrap text-muted-foreground">
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
