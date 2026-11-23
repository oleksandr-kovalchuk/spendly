import type { DefaultCategoryKey } from "@/shared/db/app-constants";

type Translate = (key: `defaults.${DefaultCategoryKey}`) => string;

export function categoryLabel(
  category: { defaultKey: DefaultCategoryKey | null; name: string | null },
  t: Translate,
) {
  return category.name ?? t(`defaults.${category.defaultKey ?? "other"}`);
}
