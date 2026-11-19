import type { DefaultCategoryKey } from "@/shared/db/app-schema";

type Translate = (key: `defaults.${DefaultCategoryKey}`) => string;

// A default category shows translated until the user renames it
export function categoryLabel(
  category: { defaultKey: DefaultCategoryKey | null; name: string | null },
  t: Translate,
) {
  return category.name ?? t(`defaults.${category.defaultKey ?? "other"}`);
}
