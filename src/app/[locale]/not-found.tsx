import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { PublicShell } from "@/views/app-shell/public-shell";
import { NotFoundPage } from "@/views/not-found/not-found-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return { title: pageTitle(t("title")) };
}

// Outside the route groups, so it brings the signed-out top bar itself
export default function NotFound() {
  return (
    <PublicShell>
      <NotFoundPage />
    </PublicShell>
  );
}
