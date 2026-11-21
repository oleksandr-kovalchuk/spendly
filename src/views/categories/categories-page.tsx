import { getTranslations } from "next-intl/server";
import { cache, Suspense, useId, type ReactNode } from "react";

import { AddCategoryButton } from "@/features/categories/add-category-button";
import { countTransactionsByCategory } from "@/features/categories/categories.dal";
import { CategoryItem } from "@/features/categories/category-item";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { CATEGORY_TYPES, type CategoryType } from "@/shared/db/app-constants";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageHeading } from "@/shared/ui/page-heading";
import { PageTransition } from "@/views/app-shell/page-transition";

// Both lists render from one pair of queries
const getCategories = cache(async () => {
  const [categories, transactionCounts] = await Promise.all([
    listCategories(),
    countTransactionsByCategory(),
  ]);
  return { categories, transactionCounts };
});

async function CategoryList({ type }: { type: CategoryType }) {
  const [{ categories, transactionCounts }, t] = await Promise.all([
    getCategories(),
    getTranslations("Categories"),
  ]);
  const ofType = categories.filter((category) => category.type === type);
  if (ofType.length === 0) return <p className="text-muted-foreground">{t("list.empty")}</p>;

  // A deleted Other comes back under its translated name when transactions move to it
  const other = ofType.find((category) => category.defaultKey === "other");
  const otherLabel = other ? categoryLabel(other, t) : t("defaults.other");

  return (
    <ul className="divide-y divide-border">
      {ofType.map((category) => (
        <CategoryItem
          key={category.id}
          id={category.id}
          label={categoryLabel(category, t)}
          defaultKey={category.defaultKey}
          icon={category.icon}
          transactionCount={transactionCounts.get(category.id) ?? 0}
          otherLabel={otherLabel}
        />
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

type CategorySectionProps = { heading: string; action: ReactNode; children: ReactNode };

function CategorySection({ heading, action, children }: CategorySectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card>
        <CardHeader className="items-center">
          <CardTitle>
            {/* Focus lands here after a delete removes the focused row */}
            <h2 id={headingId} tabIndex={-1} className="outline-none">
              {heading}
            </h2>
          </CardTitle>
          <CardAction>{action}</CardAction>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

export async function CategoriesPage() {
  const t = await getTranslations("Categories");

  return (
    <PageTransition>
      <div className="grid stagger gap-6">
        <PageHeading>{t("heading")}</PageHeading>
        <div className="@container">
          <div className="grid items-start gap-4 @2xl:grid-cols-2">
            {CATEGORY_TYPES.map((type) => (
              <CategorySection
                key={type}
                heading={t(`list.${type}Heading`)}
                action={<AddCategoryButton type={type} />}
              >
                <Suspense fallback={<ListSkeleton />}>
                  <CategoryList type={type} />
                </Suspense>
              </CategorySection>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
