import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cache, Suspense, useId, type ReactNode } from "react";

import { CategoryItem } from "@/features/categories/category-item";
import { CreateCategoryForm } from "@/features/categories/create-category-form";
import { getCurrentUser } from "@/shared/auth/session";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { CATEGORY_TYPES, type CategoryType } from "@/shared/db/app-schema";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageTransition } from "@/views/app-shell/page-transition";

// Both lists render from one query
const getCategories = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect(`/${await getLocale()}/sign-in`);

  return listCategories(user.id);
});

async function CategoryList({ type }: { type: CategoryType }) {
  const [categories, t] = await Promise.all([getCategories(), getTranslations("Categories")]);

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {categories
        .filter((category) => category.type === type)
        .map((category) => (
          <CategoryItem key={category.id} id={category.id} label={categoryLabel(category, t)} />
        ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

function CategorySection({ heading, children }: { heading: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="grid gap-4">
      <h2 id={headingId} className="text-lg font-medium">
        {heading}
      </h2>
      {children}
    </section>
  );
}

export async function CategoriesPage() {
  const t = await getTranslations("Categories");

  return (
    <PageTransition>
      <div className="grid gap-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
        {CATEGORY_TYPES.map((type) => (
          <CategorySection key={type} heading={t(`list.${type}Heading`)}>
            <Suspense fallback={<ListSkeleton />}>
              <CategoryList type={type} />
            </Suspense>
            <CreateCategoryForm type={type} />
          </CategorySection>
        ))}
      </div>
    </PageTransition>
  );
}
