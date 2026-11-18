import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { HomePage } from "@/views/home/home-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return { title: pageTitle(t("title")) };
}

export default HomePage;
