import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { localizedAlternates } from "@/shared/lib/localized-alternates";
import { pageTitle } from "@/shared/lib/page-title";
import { SignUpPage } from "@/views/sign-up/sign-up-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const [{ locale }, t] = await Promise.all([params, getTranslations("Auth.signUp")]);

  return { title: pageTitle(t("title")), alternates: localizedAlternates(locale, "/sign-up") };
}

export default SignUpPage;
