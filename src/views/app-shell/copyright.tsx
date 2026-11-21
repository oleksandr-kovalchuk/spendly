import { getTranslations } from "next-intl/server";
import { cacheLife } from "next/cache";

import { APP_NAME } from "@/shared/lib/page-title";

// Cached for a day: the signed-out pages stay prerendered and the year still turns over
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getUTCFullYear();
}

export async function Copyright() {
  const [year, t] = await Promise.all([getCurrentYear(), getTranslations("Layout")]);

  // The year as text: a number would be grouped ("2 026") in Ukrainian
  return (
    <p className="text-sm text-muted-foreground">
      {t("copyright", { year: String(year), app: APP_NAME })}
      <span className="max-sm:hidden"> · {t("rights")}</span>
    </p>
  );
}
