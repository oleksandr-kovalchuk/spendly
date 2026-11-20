import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function StatsError({ retry }: { retry: () => void }) {
  const t = useTranslations("Stats");

  return (
    <div role="alert" className="grid justify-items-start gap-3">
      <p>{t("loadFailed")}</p>
      <Button variant="outline" onClick={() => retry()}>
        {t("retry")}
      </Button>
    </div>
  );
}
