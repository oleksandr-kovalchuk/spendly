import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { localizedAlternates } from "@/shared/lib/localized-alternates";
import { pageTitle } from "@/shared/lib/page-title";
import { SignInPage } from "@/views/sign-in/sign-in-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const [{ locale }, t] = await Promise.all([params, getTranslations("Auth.signIn")]);

  return { title: pageTitle(t("title")), alternates: localizedAlternates(locale, "/sign-in") };
}

export default function Page({ searchParams }: PageProps<"/[locale]/sign-in">) {
  return <SignInPage searchParams={searchParams} />;
}
