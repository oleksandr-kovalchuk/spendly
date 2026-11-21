import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { PageHeading } from "@/shared/ui/page-heading";

export function ErrorPage({ retry }: { retry: () => void }) {
  const t = useTranslations("Error");

  return (
    <div className="m-auto grid max-w-md stagger justify-items-center gap-4 py-10 text-center">
      <span
        aria-hidden="true"
        className="sheen flex size-24 items-center justify-center rounded-3xl bg-aurora text-aurora-foreground shadow-aurora"
      >
        <TriangleAlertIcon className="size-10" />
      </span>
      <PageHeading>{t("title")}</PageHeading>
      <p className="text-muted-foreground">{t("text")}</p>
      <Button size="xl" onClick={() => retry()}>
        {t("retry")}
      </Button>
    </div>
  );
}
