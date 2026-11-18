import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";

async function PrivateHome() {
  const user = await getCurrentUser();
  if (!user) redirect(`/${await getLocale()}/sign-in`);

  const t = await getTranslations("Home");

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
      <p className="text-muted-foreground">{t("text")}</p>
      <p className="text-sm text-muted-foreground">{t("signedInAs", { email: user.email })}</p>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-5 w-1/2" />
    </>
  );
}

export function HomePage() {
  return (
    <div className="grid gap-3">
      <Suspense fallback={<HomeSkeleton />}>
        <PrivateHome />
      </Suspense>
    </div>
  );
}
