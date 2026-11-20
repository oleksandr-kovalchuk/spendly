import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { CategoriesPage } from "@/views/categories/categories-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Categories");
  return { title: pageTitle(t("title")) };
}

export default CategoriesPage;
