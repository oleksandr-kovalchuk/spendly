import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignUpForm } from "@/features/auth/sign-up-form";
import { getCurrentUser } from "@/shared/auth/session";
import { Skeleton } from "@/shared/ui/skeleton";

async function SignUpContent() {
  const user = await getCurrentUser();
  if (user) redirect(`/${await getLocale()}`);

  return <SignUpForm />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-9" />
    </div>
  );
}

export async function SignUpPage() {
  const t = await getTranslations("Auth.signUp");

  return (
    <div className="mx-auto grid w-full max-w-sm gap-6">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
      <Suspense fallback={<FormSkeleton />}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}
