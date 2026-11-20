import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { PageHeading } from "@/shared/ui/page-heading";

export function ErrorPage({ retry }: { retry: () => void }) {
  const t = useTranslations("Error");

  return (
    <div className="grid justify-items-start gap-3">
      <PageHeading>{t("title")}</PageHeading>
      <p className="text-muted-foreground">{t("text")}</p>
      <Button onClick={() => retry()}>{t("retry")}</Button>
    </div>
  );
}
