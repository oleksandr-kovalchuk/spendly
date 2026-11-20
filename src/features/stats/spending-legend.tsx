import { useFormatter, useTranslations } from "next-intl";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import type { SpendingItem } from "./spending-item";

type SpendingLegendProps = { items: SpendingItem[]; labelledBy: string };

// Each category's name, amount and share of the period's expenses, in the chart's order;
// a table, so screen readers get the chart's data with its column names
export function SpendingLegend({ items, labelledBy }: SpendingLegendProps) {
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
          <tr key={item.id}>
            <th scope="row" className="py-1 text-start font-normal break-words">
              {item.label}
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
