import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

export async function PrivacyLink() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Privacy")]);

  return (
    <Link
      href={`/${locale}/privacy`}
      className="inline-flex min-h-6 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      {t("title")}
    </Link>
  );
}
