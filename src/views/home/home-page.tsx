import { getTranslations } from "next-intl/server";

export async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <div className="grid gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
      <p className="text-muted-foreground">{t("text")}</p>
    </div>
  );
}
