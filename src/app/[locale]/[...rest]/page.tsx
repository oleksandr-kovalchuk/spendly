import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { NotFoundPage } from "@/views/not-found/not-found-page";

// notFound() here is rendered by the client after the shell, so the HTML would have no content or title
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return { title: pageTitle(t("title")), robots: { index: false } };
}

export default NotFoundPage;
