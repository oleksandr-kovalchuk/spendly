import { useFormatter } from "next-intl";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

import type { SpendingItem } from "./spending-item";

// Each category's name, amount and share of the period's expenses, in the chart's order
export function SpendingLegend({ items }: { items: SpendingItem[] }) {
  const format = useFormatter();
  const total = items.reduce((sum, item) => sum + item.amountKopecks, 0);

  return (
    <ol className="grid content-start gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 break-words">{item.label}</span>
          <span className="flex shrink-0 items-baseline gap-3 tabular-nums">
            <span className="font-medium">
              {format.number(hryvniasOf(item.amountKopecks), MONEY_FORMAT)}
            </span>
            <span className="w-14 text-end text-muted-foreground">
              {format.number(item.amountKopecks / total, {
                style: "percent",
                maximumFractionDigits: 1,
              })}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
