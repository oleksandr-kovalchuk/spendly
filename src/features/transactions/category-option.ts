import type { CategoryIconKey, CategoryType, DefaultCategoryKey } from "@/shared/db/app-constants";

export type CategoryOption = {
  id: string;
  type: CategoryType;
  defaultKey: DefaultCategoryKey | null;
  icon: CategoryIconKey | null;
  label: string;
};
