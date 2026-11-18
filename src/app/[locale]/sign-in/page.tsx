import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { SignInPage } from "@/views/sign-in/sign-in-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.signIn");
  return { title: pageTitle(t("title")) };
}

export default function Page({ searchParams }: PageProps<"/[locale]/sign-in">) {
  return <SignInPage searchParams={searchParams} />;
}
