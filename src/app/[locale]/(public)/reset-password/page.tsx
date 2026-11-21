import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { ResetPasswordPage } from "@/views/reset-password/reset-password-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.resetPassword");
  return { title: pageTitle(t("title")), robots: { index: false } };
}

export default function Page({ searchParams }: PageProps<"/[locale]/reset-password">) {
  return <ResetPasswordPage searchParams={searchParams} />;
}
