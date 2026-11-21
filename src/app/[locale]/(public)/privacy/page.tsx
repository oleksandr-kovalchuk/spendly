import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { localizedAlternates } from "@/shared/lib/localized-alternates";
import { pageTitle } from "@/shared/lib/page-title";
import { PrivacyPage } from "@/views/privacy/privacy-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const [{ locale }, t] = await Promise.all([params, getTranslations("Privacy")]);

  return {
    title: pageTitle(t("title")),
    alternates: localizedAlternates(locale, "/privacy"),
  };
}

export default function Page() {
  return <PrivacyPage />;
}
