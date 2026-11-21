import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { SettingsPage } from "@/views/settings/settings-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Settings");
  return { title: pageTitle(t("title")) };
}

export default SettingsPage;
