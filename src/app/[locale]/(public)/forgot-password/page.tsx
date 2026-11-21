import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { ForgotPasswordPage } from "@/views/forgot-password/forgot-password-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.forgotPassword");
  return { title: pageTitle(t("title")), robots: { index: false } };
}

export default ForgotPasswordPage;
