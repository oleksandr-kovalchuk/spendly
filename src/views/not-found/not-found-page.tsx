import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { locale } from "next/root-params";

import { buttonVariants } from "@/shared/ui/button";
import { PageHeading } from "@/shared/ui/page-heading";

export async function NotFoundPage() {
  const t = await getTranslations("NotFound");
  const current = await locale();

  return (
    <div className="grid justify-items-start gap-3">
      <PageHeading>{t("title")}</PageHeading>
      <p className="text-muted-foreground">{t("text")}</p>
      <Link href={`/${current}`} className={buttonVariants()}>
        {t("homeLink")}
      </Link>
    </div>
  );
}
