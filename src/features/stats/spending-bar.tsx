import { cn } from "cn";

import { categorySwatchVariants } from "@/shared/categories/category-look";

import type { SpendingItem } from "./spending-item";

// The legend carries the same data as text, so the bar stays out of the accessibility tree;
// a tiny share still shows a sliver
export function SpendingBar({ items }: { items: SpendingItem[] }) {
  const total = items.reduce((sum, item) => sum + item.amountKopecks, 0);

  return (
    <div aria-hidden="true" className="flex h-3 animate-grow gap-1 overflow-hidden rounded-full">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "h-full min-w-1 rounded-full",
            categorySwatchVariants({ color: item.color }),
          )}
          style={{ flexGrow: item.amountKopecks / total, flexBasis: 0 }}
        />
      ))}
    </div>
  );
}
