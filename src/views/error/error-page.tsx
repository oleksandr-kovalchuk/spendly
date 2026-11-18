import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function ErrorPage({ retry }: { retry: () => void }) {
  const t = useTranslations("Error");

  return (
    <div className="grid justify-items-start gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("title")}</h1>
      <p className="text-muted-foreground">{t("text")}</p>
      <Button onClick={() => retry()}>{t("retry")}</Button>
    </div>
  );
}
