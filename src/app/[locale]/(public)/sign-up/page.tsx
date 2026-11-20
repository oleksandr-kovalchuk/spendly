import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { SignUpPage } from "@/views/sign-up/sign-up-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.signUp");
  return { title: pageTitle(t("title")) };
}

export default SignUpPage;
