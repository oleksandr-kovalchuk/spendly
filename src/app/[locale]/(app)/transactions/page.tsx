import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { pageTitle } from "@/shared/lib/page-title";
import { TransactionsPage } from "@/views/transactions/transactions-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Transactions");
  return { title: pageTitle(t("title")) };
}

export default TransactionsPage;
