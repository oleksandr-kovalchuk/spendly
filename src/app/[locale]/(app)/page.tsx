import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { OverviewPage } from "@/views/overview/overview-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return { title: pageTitle(t("title")) };
}

export default OverviewPage;
