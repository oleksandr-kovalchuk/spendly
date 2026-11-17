import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { locale } from "next/root-params";

import { buttonVariants } from "@/shared/ui/button";

export async function NotFoundPage() {
  const t = await getTranslations("NotFound");
  const current = await locale();

  return (
    <div className="grid justify-items-start gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("title")}</h1>
      <p className="text-muted-foreground">{t("text")}</p>
      <Link href={`/${current}`} className={buttonVariants()}>
        {t("homeLink")}
      </Link>
    </div>
  );
}
