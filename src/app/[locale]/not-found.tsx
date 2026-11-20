import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { PublicShell } from "@/views/app-shell/public-shell";
import { NotFoundPage } from "@/views/not-found/not-found-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return { title: pageTitle(t("title")) };
}

// Only this root not-found sets its title, so it stays outside the route groups and brings the
// signed-out top bar itself; Next loads its Client Components on every page, which both layouts load anyway
export default function NotFound() {
  return (
    <PublicShell>
      <NotFoundPage />
    </PublicShell>
  );
}
