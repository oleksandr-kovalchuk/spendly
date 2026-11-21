import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { locale } from "next/root-params";

import { buttonVariants } from "@/shared/ui/button";
import { PageHeading } from "@/shared/ui/page-heading";

export async function NotFoundPage() {
  const t = await getTranslations("NotFound");
  const current = await locale();

  return (
    <div className="m-auto grid max-w-md stagger justify-items-center gap-4 py-10 text-center">
      <span
        aria-hidden="true"
        className="sheen flex h-24 items-center rounded-3xl bg-aurora px-8 text-5xl font-semibold tracking-tighter text-aurora-foreground shadow-aurora"
      >
        404
      </span>
      <PageHeading>{t("title")}</PageHeading>
      <p className="text-muted-foreground">{t("text")}</p>
      <Link href={`/${current}`} className={buttonVariants({ size: "xl" })}>
        {t("homeLink")}
      </Link>
    </div>
  );
}
