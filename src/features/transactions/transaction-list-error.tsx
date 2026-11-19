import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function TransactionListError({ retry }: { retry: () => void }) {
  const t = useTranslations("Transactions");

  return (
    <div role="alert" className="grid justify-items-start gap-3">
      <p>{t("list.loadFailed")}</p>
      <Button variant="outline" onClick={() => retry()}>
        {t("list.retry")}
      </Button>
    </div>
  );
}
