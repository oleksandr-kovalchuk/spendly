import type { CategoryIconKey, DefaultCategoryKey } from "@/shared/db/app-constants";

import { categoryLook, categoryTileVariants } from "./category-look";

type CategoryIconProps = {
  category: { id: string; defaultKey: DefaultCategoryKey | null; icon: CategoryIconKey | null };
  size?: "default" | "sm";
};

// Decorative: the category's name always shows next to it
export function CategoryIcon({ category, size }: CategoryIconProps) {
  const { icon: Icon, color } = categoryLook(category);

  return (
    <span className={categoryTileVariants({ color, size })}>
      <Icon aria-hidden />
    </span>
  );
}
