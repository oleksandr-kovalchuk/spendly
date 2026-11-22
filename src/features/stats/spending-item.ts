import type { CategoryColor } from "@/shared/categories/category-look";

export type SpendingItem = {
  id: string;
  label: string;
  amountKopecks: number;
  color: CategoryColor;
  transactionsQuery: Record<string, string>;
};
